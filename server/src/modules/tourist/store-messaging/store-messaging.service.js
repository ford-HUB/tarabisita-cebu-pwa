import mongoose from 'mongoose'
import User from '../../auth/models/user.model.js'
import CustomerOrder from '../../business/customer-orders/models/customer-order.model.js'
import Business from '../../business/models/business.model.js'
import StoreConversation from './models/store-conversation.model.js'
import StoreMessage from './models/store-message.model.js'
import { sealStoreMessagingPayload, openStoreMessagingPayload } from '../../../shared/utils/storeMessagingToken.utils.js'

const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Tourist hub hides threads when the order is done or canceled (`CustomerOrder.status`). */
const TOURIST_MESSAGING_CLOSED_STATUSES = new Set(['FINISHED', 'CANCELED'])

const isInquiryConversation = (conv) =>
    conv?.conversationKind === 'INQUIRY' || (conv != null && conv.customerOrderId == null)

const assertOrderAllowsTouristMessaging = (order) => {
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    const s = String(order.status || '').toUpperCase()
    if (TOURIST_MESSAGING_CLOSED_STATUSES.has(s)) {
        throw new Error('ORDER_MESSAGING_CLOSED')
    }
}

const formatPhp = (amount) => {
    const n = Number(amount)
    if (!Number.isFinite(n)) return '₱0.00'
    return `₱${n.toFixed(2)}`
}

const resolveBusinessCategorySlug = (business) => {
    const categoryName =
        business?.category && typeof business.category === 'object'
            ? String(business.category.name || '')
            : String(business?.category || '')
    const normalized = categoryName.trim().toLowerCase()
    if (normalized === 'resort' || normalized === 'hotel') return 'resort'
    if (normalized === 'restaurant') return 'restaurant'
    return normalized
}

const extractBusinessCard = (businessDoc) => {
    if (!businessDoc || typeof businessDoc !== 'object') {
        return { businessName: '', businessStoreImage: '' }
    }
    const ci = businessDoc.contact_info && typeof businessDoc.contact_info === 'object' ? businessDoc.contact_info : {}
    const social = businessDoc.socialMedia && typeof businessDoc.socialMedia === 'object' ? businessDoc.socialMedia : {}
    const wa = social.whatsapp ?? social.whatsApp ?? social.WhatsApp ?? ''
    const logo = businessDoc.logo != null ? String(businessDoc.logo).trim() : ''
    const cover = businessDoc.coverImage != null ? String(businessDoc.coverImage).trim() : ''
    const banner = businessDoc.banner != null ? String(businessDoc.banner).trim() : ''
    return {
        businessName: businessDoc.name != null ? String(businessDoc.name).trim() : '',
        businessStoreImage: logo || cover || banner || '',
        businessPhone: ci.phone != null ? String(ci.phone).trim() : '',
        businessEmail: ci.email != null ? String(ci.email).trim() : '',
        businessWebsite: businessDoc.website != null ? String(businessDoc.website).trim() : '',
        businessWhatsapp: String(wa || '').trim()
    }
}

const buildInquirySnapshot = (businessLean) => {
    const card = extractBusinessCard(businessLean)
    return {
        orderType: 'INQUIRY',
        productName: 'General inquiry',
        productImage: card.businessStoreImage || '',
        productDetails: '',
        orderCode: '',
        itemsCount: null,
        total: '',
        amount: null,
        currency: 'PHP',
        status: 'OPEN',
        notes: '',
        businessName: card.businessName,
        businessStoreImage: card.businessStoreImage
    }
}

const buildOrderSnapshot = (orderLean, businessLean) => {
    const card = extractBusinessCard(businessLean)
    return {
        orderCode: orderLean.orderCode,
        orderType: orderLean.orderType,
        productName: orderLean.productName,
        productImage: orderLean.productImage || '',
        productDetails: orderLean.productDetails || '',
        itemsCount: orderLean.itemsCount,
        total: formatPhp(orderLean.amount),
        amount: orderLean.amount,
        currency: orderLean.currency || 'PHP',
        status: orderLean.status,
        notes: orderLean.notes || '',
        businessName: card.businessName,
        businessStoreImage: card.businessStoreImage
    }
}

/** Keep persisted snapshot extras but always overlay live order fields (status, orderType, totals). */
const overlayFreshOrderOnSnapshot = (storedSnapshot, orderLean, businessLean) => {
    const fresh = buildOrderSnapshot(orderLean, businessLean)
    if (!storedSnapshot || typeof storedSnapshot !== 'object') {
        return fresh
    }
    return { ...storedSnapshot, ...fresh }
}

const mapMessage = (m) => ({
    id: String(m._id),
    conversationId: m.conversationId != null ? String(m.conversationId) : '',
    body: m.body,
    senderRole: m.senderRole,
    senderUserId: String(m.senderUserId),
    createdAt: m.createdAt
})

export const createStoreMessagingLinkToken = async (touristUserId, { businessId, customerOrderId }) => {
    const uid = String(touristUserId)
    const bid = String(businessId || '')
    const oid = String(customerOrderId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(bid)) {
        throw new Error('INVALID_IDS')
    }

    const exp = Date.now() + LINK_TTL_MS

    if (!oid) {
        const business = await Business.findById(bid).populate('category', 'name').lean()
        if (!business) {
            throw new Error('BUSINESS_NOT_FOUND')
        }
        if (resolveBusinessCategorySlug(business) !== 'resort') {
            throw new Error('INQUIRY_MESSAGING_NOT_AVAILABLE')
        }
        const token = sealStoreMessagingPayload({
            v: 1,
            kind: 'INQUIRY',
            touristUserId: uid,
            businessId: bid,
            exp
        })
        return { messagingToken: token, expiresAt: new Date(exp).toISOString() }
    }

    if (!mongoose.Types.ObjectId.isValid(oid)) {
        throw new Error('INVALID_IDS')
    }
    const order = await CustomerOrder.findOne({
        _id: oid,
        businessId: bid,
        placedByUserId: uid
    })
        .populate('businessId', 'name contact_info website socialMedia logo coverImage banner')
        .lean()
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    assertOrderAllowsTouristMessaging(order)
    const token = sealStoreMessagingPayload({
        v: 1,
        kind: 'ORDER',
        touristUserId: uid,
        businessId: bid,
        customerOrderId: oid,
        exp
    })
    return { messagingToken: token, expiresAt: new Date(exp).toISOString() }
}

const assertTokenForTourist = (touristUserId, messagingToken) => {
    let payload
    try {
        payload = openStoreMessagingPayload(messagingToken)
    } catch {
        throw new Error('INVALID_MESSAGING_TOKEN')
    }
    const isInquiry = payload.kind === 'INQUIRY'
    const hasOrderFields = payload.customerOrderId != null && String(payload.customerOrderId).trim() !== ''
    if (payload.v !== 1 || !payload.exp || !payload.touristUserId || !payload.businessId) {
        throw new Error('INVALID_MESSAGING_TOKEN')
    }
    if (!isInquiry && !hasOrderFields) {
        throw new Error('INVALID_MESSAGING_TOKEN')
    }
    if (Number(payload.exp) < Date.now()) {
        throw new Error('MESSAGING_TOKEN_EXPIRED')
    }
    if (String(payload.touristUserId) !== String(touristUserId)) {
        throw new Error('MESSAGING_TOKEN_MISMATCH')
    }
    return payload
}

const getOrCreateConversation = async ({ touristUserId, businessId, customerOrderId, orderSnapshot }) => {
    const existing = await StoreConversation.findOne({
        touristUserId,
        businessId,
        customerOrderId,
        conversationKind: 'ORDER'
    }).lean()
    if (existing) {
        if (!existing.orderSnapshot && orderSnapshot) {
            await StoreConversation.updateOne({ _id: existing._id }, { $set: { orderSnapshot } })
            return StoreConversation.findById(existing._id).lean()
        }
        return existing
    }
    const created = await StoreConversation.create({
        touristUserId,
        businessId,
        customerOrderId,
        conversationKind: 'ORDER',
        orderSnapshot
    })
    return created.toObject()
}

const getOrCreateInquiryConversation = async ({ touristUserId, businessId, orderSnapshot }) => {
    const existing = await StoreConversation.findOne({
        touristUserId,
        businessId,
        conversationKind: 'INQUIRY'
    }).lean()
    if (existing) {
        if (!existing.orderSnapshot && orderSnapshot) {
            await StoreConversation.updateOne({ _id: existing._id }, { $set: { orderSnapshot } })
            return StoreConversation.findById(existing._id).lean()
        }
        return existing
    }
    const created = await StoreConversation.create({
        touristUserId,
        businessId,
        conversationKind: 'INQUIRY',
        orderSnapshot
    })
    return created.toObject()
}

export const resolveTouristMessagingSession = async (touristUserId, messagingToken) => {
    const payload = assertTokenForTourist(touristUserId, messagingToken)

    if (payload.kind === 'INQUIRY') {
        const business = await Business.findById(payload.businessId)
            .populate('category', 'name')
            .select('name contact_info website socialMedia logo coverImage banner category')
            .lean()
        if (!business) {
            throw new Error('BUSINESS_NOT_FOUND')
        }
        if (resolveBusinessCategorySlug(business) !== 'resort') {
            throw new Error('INQUIRY_MESSAGING_NOT_AVAILABLE')
        }
        const snapshot = buildInquirySnapshot(business)
        const conv = await getOrCreateInquiryConversation({
            touristUserId,
            businessId: business._id,
            orderSnapshot: snapshot
        })
        const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
        const card = extractBusinessCard(business)
        return {
            conversationId: String(conv._id),
            businessId: String(business._id),
            conversationKind: 'INQUIRY',
            ...card,
            orderSnapshot: snapshot,
            messages: messages.map(mapMessage)
        }
    }

    const order = await CustomerOrder.findOne({
        _id: payload.customerOrderId,
        businessId: payload.businessId,
        placedByUserId: touristUserId
    })
        .populate('businessId', 'name contact_info website socialMedia logo coverImage banner')
        .lean()
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    assertOrderAllowsTouristMessaging(order)
    const b = order.businessId && typeof order.businessId === 'object' && order.businessId._id ? order.businessId : null
    const snapshot = buildOrderSnapshot(order, b)
    const businessObjectId =
        order.businessId && typeof order.businessId === 'object' && order.businessId._id
            ? order.businessId._id
            : order.businessId
    const conv = await getOrCreateConversation({
        touristUserId,
        businessId: businessObjectId,
        customerOrderId: order._id,
        orderSnapshot: snapshot
    })
    const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
    const card = extractBusinessCard(b)
    return {
        conversationId: String(conv._id),
        businessId: String(order.businessId._id || order.businessId),
        conversationKind: 'ORDER',
        ...card,
        orderSnapshot: overlayFreshOrderOnSnapshot(conv.orderSnapshot, order, b),
        messages: messages.map(mapMessage)
    }
}

export const resolveTouristMessagingThread = async (touristUserId, conversationId) => {
    if (!mongoose.Types.ObjectId.isValid(String(conversationId || ''))) {
        throw new Error('INVALID_CONVERSATION_ID')
    }
    const conv = await StoreConversation.findOne({
        _id: conversationId,
        touristUserId
    }).lean()
    if (!conv) {
        throw new Error('CONVERSATION_NOT_FOUND')
    }

    if (isInquiryConversation(conv)) {
        const business = await Business.findById(conv.businessId)
            .select('name contact_info website socialMedia logo coverImage banner')
            .lean()
        if (!business) {
            throw new Error('BUSINESS_NOT_FOUND')
        }
        const snapshot =
            conv.orderSnapshot && typeof conv.orderSnapshot === 'object'
                ? conv.orderSnapshot
                : buildInquirySnapshot(business)
        const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
        const card = extractBusinessCard(business)
        return {
            conversationId: String(conv._id),
            businessId: String(conv.businessId),
            conversationKind: 'INQUIRY',
            ...card,
            orderSnapshot: snapshot,
            messages: messages.map(mapMessage)
        }
    }

    const order = await CustomerOrder.findById(conv.customerOrderId)
        .populate('businessId', 'name contact_info website socialMedia logo coverImage banner')
        .lean()
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    assertOrderAllowsTouristMessaging(order)
    const b = order.businessId && typeof order.businessId === 'object' && order.businessId._id ? order.businessId : null
    const snapshot = overlayFreshOrderOnSnapshot(conv.orderSnapshot, order, b)
    const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
    const card = extractBusinessCard(b)
    return {
        conversationId: String(conv._id),
        businessId: String(order.businessId._id || order.businessId),
        conversationKind: 'ORDER',
        ...card,
        orderSnapshot: snapshot,
        messages: messages.map(mapMessage)
    }
}

export const listTouristConversations = async (touristUserId) => {
    const rows = await StoreConversation.find({ touristUserId })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .populate('businessId', 'name logo coverImage banner')
        .lean()
    const orderIds = [...new Set(rows.map((r) => r.customerOrderId).filter(Boolean).map((id) => String(id)))]
    const validOids = orderIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
    const orders =
        validOids.length > 0
            ? await CustomerOrder.find({ _id: { $in: validOids } })
                  .select('_id status')
                  .lean()
            : []
    const statusByOrderId = new Map(orders.map((o) => [String(o._id), String(o.status || '').toUpperCase()]))
    const activeRows = rows.filter((r) => {
        if (isInquiryConversation(r)) return true
        const st = statusByOrderId.get(String(r.customerOrderId || ''))
        if (!st) return false
        return !TOURIST_MESSAGING_CLOSED_STATUSES.has(st)
    })
    return activeRows.map((r) => {
        const b = r.businessId && typeof r.businessId === 'object' ? r.businessId : null
        const card = extractBusinessCard(b)
        const snap = r.orderSnapshot && typeof r.orderSnapshot === 'object' ? r.orderSnapshot : {}
        const inquiry = isInquiryConversation(r)
        return {
            conversationId: String(r._id),
            businessId: String(r.businessId?._id || r.businessId),
            businessName: card.businessName,
            businessStoreImage: card.businessStoreImage,
            conversationKind: inquiry ? 'INQUIRY' : 'ORDER',
            orderCode: snap.orderCode || '',
            productName: inquiry ? snap.productName || 'General inquiry' : snap.productName || '',
            lastMessageAt: r.lastMessageAt || r.updatedAt
        }
    })
}

export const appendStoreMessage = async ({ conversationId, senderUserId, senderRole, body }) => {
    const text = String(body || '').trim()
    if (!text) {
        throw new Error('EMPTY_MESSAGE')
    }
    const conv = await StoreConversation.findById(conversationId).lean()
    if (!conv) {
        throw new Error('CONVERSATION_NOT_FOUND')
    }
    const msg = await StoreMessage.create({
        conversationId: conv._id,
        senderUserId,
        senderRole,
        body: text.slice(0, 4000)
    })
    await StoreConversation.updateOne({ _id: conv._id }, { $set: { lastMessageAt: new Date() } })
    return mapMessage(msg.toObject())
}

export const listBusinessConversations = async (businessUserId) => {
    const biz = await Business.findOne({ userId: businessUserId }).populate('category', 'name').lean()
    if (!biz) {
        return []
    }
    const rows = await StoreConversation.find({ businessId: biz._id })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .populate('touristUserId', 'name avatar')
        .lean()

    /** Restaurant hub: hide threads tied to finished/canceled orders (same closed set as tourist messaging). */
    const categorySlug = resolveBusinessCategorySlug(biz)
    const isRestaurant = categorySlug === 'restaurant'
    let activeRows = rows
    if (isRestaurant) {
        const orderIds = [...new Set(rows.map((r) => r.customerOrderId).filter(Boolean).map((id) => String(id)))]
        const validOids = orderIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        const orders =
            validOids.length > 0
                ? await CustomerOrder.find({ _id: { $in: validOids } })
                      .select('_id status')
                      .lean()
                : []
        const statusByOrderId = new Map(orders.map((o) => [String(o._id), String(o.status || '').toUpperCase()]))
        activeRows = rows.filter((r) => {
            const st = statusByOrderId.get(String(r.customerOrderId || ''))
            if (!st) return false
            return !TOURIST_MESSAGING_CLOSED_STATUSES.has(st)
        })
    }

    /** Resort/hotel chat sidebar: unread customer messages since the business last opened the thread. */
    const unreadByConvId = new Map()
    if (categorySlug === 'resort' && activeRows.length > 0) {
        const ids = activeRows.map((r) => r._id).filter(Boolean)
        if (ids.length > 0) {
            const unreadRows = await StoreConversation.aggregate([
                { $match: { _id: { $in: ids } } },
                { $lookup: unreadTouristMessagesLookup() },
                { $project: { _id: 1, unreadFromCustomerCount: { $size: '$unreadTouristMessages' } } }
            ])
            for (const ur of unreadRows) {
                unreadByConvId.set(String(ur._id), Number(ur.unreadFromCustomerCount) || 0)
            }
        }
    }

    return activeRows.map((r) => {
        const u = r.touristUserId && typeof r.touristUserId === 'object' ? r.touristUserId : null
        const snap = r.orderSnapshot && typeof r.orderSnapshot === 'object' ? r.orderSnapshot : {}
        return {
            conversationId: String(r._id),
            touristUserId: String(r.touristUserId?._id || r.touristUserId),
            touristName: u?.name != null ? String(u.name).trim() : 'Guest',
            touristAvatar: u?.avatar != null ? String(u.avatar).trim() : '',
            orderCode: snap.orderCode || '',
            productName: snap.productName || '',
            lastMessageAt: r.lastMessageAt || r.updatedAt,
            unreadFromCustomerCount:
                categorySlug === 'resort' ? unreadByConvId.get(String(r._id)) || 0 : 0
        }
    })
}

export const resolveBusinessMessagingThread = async (businessUserId, conversationId) => {
    if (!mongoose.Types.ObjectId.isValid(String(conversationId || ''))) {
        throw new Error('INVALID_CONVERSATION_ID')
    }
    const biz = await Business.findOne({ userId: businessUserId }).lean()
    if (!biz) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    const conv = await StoreConversation.findOne({
        _id: conversationId,
        businessId: biz._id
    }).lean()
    if (!conv) {
        throw new Error('CONVERSATION_NOT_FOUND')
    }

    const tourist = await User.findById(conv.touristUserId).select('name avatar').lean()

    if (isInquiryConversation(conv)) {
        const business = await Business.findById(conv.businessId)
            .select('name contact_info website socialMedia logo coverImage banner')
            .lean()
        const snapshot =
            conv.orderSnapshot && typeof conv.orderSnapshot === 'object'
                ? conv.orderSnapshot
                : buildInquirySnapshot(business)
        const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
        const storeName = business?.name != null ? String(business.name).trim() : ''
        await StoreConversation.updateOne({ _id: conv._id }, { $set: { businessLastReadAt: new Date() } })
        return {
            conversationId: String(conv._id),
            businessId: String(biz._id),
            businessName: storeName,
            conversationKind: 'INQUIRY',
            orderSnapshot: snapshot,
            messages: messages.map(mapMessage),
            touristName: tourist?.name != null ? String(tourist.name).trim() : 'Guest',
            touristAvatar: tourist?.avatar != null ? String(tourist.avatar).trim() : '',
            touristUserId: String(conv.touristUserId)
        }
    }

    const order = await CustomerOrder.findById(conv.customerOrderId)
        .populate('businessId', 'name contact_info website socialMedia logo coverImage banner')
        .lean()
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    const b = order.businessId && typeof order.businessId === 'object' && order.businessId._id ? order.businessId : null
    const snapshot =
        conv.orderSnapshot && typeof conv.orderSnapshot === 'object' ? conv.orderSnapshot : buildOrderSnapshot(order, b)
    const messages = await StoreMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean()
    const storeName = b?.name != null ? String(b.name).trim() : ''
    await StoreConversation.updateOne({ _id: conv._id }, { $set: { businessLastReadAt: new Date() } })
    return {
        conversationId: String(conv._id),
        businessId: String(biz._id),
        businessName: storeName,
        conversationKind: 'ORDER',
        orderSnapshot: snapshot,
        messages: messages.map(mapMessage),
        touristName: tourist?.name != null ? String(tourist.name).trim() : 'Guest',
        touristAvatar: tourist?.avatar != null ? String(tourist.avatar).trim() : '',
        touristUserId: String(conv.touristUserId)
    }
}

export const deleteBusinessConversation = async (businessUserId, conversationId) => {
    if (!mongoose.Types.ObjectId.isValid(String(conversationId || ''))) {
        throw new Error('INVALID_CONVERSATION_ID')
    }
    const biz = await Business.findOne({ userId: businessUserId }).lean()
    if (!biz) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    const conv = await StoreConversation.findOne({
        _id: conversationId,
        businessId: biz._id
    }).lean()
    if (!conv) {
        throw new Error('CONVERSATION_NOT_FOUND')
    }

    await Promise.all([
        StoreMessage.deleteMany({ conversationId: conv._id }),
        StoreConversation.deleteOne({ _id: conv._id })
    ])

    return { deleted: true, conversationId: String(conv._id) }
}

const unreadTouristMessagesLookup = () => ({
    from: 'storemessages',
    let: { convId: '$_id', readAt: '$businessLastReadAt' },
    pipeline: [
        {
            $match: {
                $expr: {
                    $and: [
                        { $eq: ['$conversationId', '$$convId'] },
                        { $eq: ['$senderRole', 'TOURIST'] },
                        { $gt: ['$createdAt', { $ifNull: ['$$readAt', new Date(0)] }] }
                    ]
                }
            }
        },
        { $sort: { createdAt: -1 } }
    ],
    as: 'unreadTouristMessages'
})

const getMessagingNotificationItemsForBusinessId = async (businessObjectId) => {
    const unreadLookup = unreadTouristMessagesLookup()
    const facetResult = await StoreConversation.aggregate([
        { $match: { businessId: businessObjectId } },
        {
            $facet: {
                totalUnread: [
                    { $lookup: unreadLookup },
                    { $addFields: { unreadForConv: { $size: '$unreadTouristMessages' } } },
                    { $group: { _id: null, total: { $sum: '$unreadForConv' } } }
                ],
                recentForDisplay: [
                    { $sort: { lastMessageAt: -1, updatedAt: -1 } },
                    { $limit: 25 },
                    { $lookup: unreadLookup },
                    {
                        $lookup: {
                            from: 'storemessages',
                            let: { convId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$conversationId', '$$convId'] },
                                                { $eq: ['$senderRole', 'TOURIST'] }
                                            ]
                                        }
                                    }
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 }
                            ],
                            as: 'latestTouristMessageArr'
                        }
                    },
                    {
                        $addFields: {
                            unreadForConv: { $size: '$unreadTouristMessages' },
                            latestUnread: { $arrayElemAt: ['$unreadTouristMessages', 0] },
                            latestTourist: { $arrayElemAt: ['$latestTouristMessageArr', 0] }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'touristUserId',
                            foreignField: '_id',
                            pipeline: [{ $project: { name: 1, avatar: 1 } }],
                            as: 'touristArr'
                        }
                    },
                    { $addFields: { tourist: { $arrayElemAt: ['$touristArr', 0] } } },
                    {
                        $project: {
                            conversationId: { $toString: '$_id' },
                            touristName: '$tourist.name',
                            touristAvatar: '$tourist.avatar',
                            messagePreview: {
                                $cond: {
                                    if: { $gt: ['$unreadForConv', 0] },
                                    then: '$latestUnread.body',
                                    else: { $ifNull: ['$latestTourist.body', ''] }
                                }
                            },
                            previewAt: {
                                $cond: {
                                    if: { $gt: ['$unreadForConv', 0] },
                                    then: '$latestUnread.createdAt',
                                    else: { $ifNull: ['$latestTourist.createdAt', '$lastMessageAt'] }
                                }
                            },
                            orderSnapshot: 1,
                            unreadForConv: 1
                        }
                    },
                    { $sort: { previewAt: -1 } }
                ]
            }
        }
    ])

    const facet = facetResult[0] || { totalUnread: [], recentForDisplay: [] }
    const unreadCount = Number(facet.totalUnread[0]?.total) || 0
    const rows = Array.isArray(facet.recentForDisplay) ? facet.recentForDisplay : []
    const items = rows.map((r) => {
        const snap = r.orderSnapshot && typeof r.orderSnapshot === 'object' ? r.orderSnapshot : {}
        const unreadForConv = Number(r.unreadForConv) || 0
        let preview = r.messagePreview != null ? String(r.messagePreview).trim() : ''
        if (!preview) {
            preview = 'No customer messages yet'
        }
        return {
            kind: 'MESSAGE',
            conversationId: r.conversationId,
            touristName:
                r.touristName != null && String(r.touristName).trim() ? String(r.touristName).trim() : 'Guest',
            touristAvatar: r.touristAvatar != null ? String(r.touristAvatar).trim() : '',
            messagePreview: preview,
            previewAt: r.previewAt || null,
            orderCode: snap.orderCode != null ? String(snap.orderCode) : '',
            productName: snap.productName != null ? String(snap.productName) : '',
            unreadCount: unreadForConv,
            isRead: unreadForConv === 0
        }
    })

    return { unreadCount, items }
}

const listOrderNotificationItemsForBusiness = async (bizLean, { orderKind = 'ORDER' } = {}) => {
    const threshold = bizLean.ordersNotificationReadAt ? new Date(bizLean.ordersNotificationReadAt) : new Date(0)
    const [unreadOrderCount, rows] = await Promise.all([
        CustomerOrder.countDocuments({
            businessId: bizLean._id,
            createdAt: { $gt: threshold }
        }),
        CustomerOrder.find({ businessId: bizLean._id })
            .sort({ createdAt: -1 })
            .limit(25)
            .select('orderCode customerName productName productImage amount currency status createdAt')
            .lean()
    ])
    const items = rows.map((o) => {
        const code = o.orderCode != null ? String(o.orderCode).trim() : ''
        const amt = formatPhp(o.amount)
        const isBooking = orderKind === 'BOOKING'
        const preview = code
            ? `New ${isBooking ? 'booking' : 'order'} #${code} · ${amt}`
            : `New ${isBooking ? 'booking' : 'order'} · ${amt}`
        const createdAt = o.createdAt ? new Date(o.createdAt) : null
        const isUnread = createdAt && createdAt > threshold
        return {
            kind: orderKind,
            orderId: String(o._id),
            orderCode: code,
            customerName: o.customerName != null ? String(o.customerName).trim() : 'Customer',
            productName: o.productName != null ? String(o.productName).trim() : isBooking ? 'Booking' : 'Order',
            productImage: o.productImage != null ? String(o.productImage).trim() : '',
            amount: Number(o.amount) || 0,
            currency: o.currency != null ? String(o.currency) : 'PHP',
            status: o.status != null ? String(o.status) : 'PLACED',
            previewAt: o.createdAt || null,
            messagePreview: preview,
            unreadCount: isUnread ? 1 : 0,
            isRead: !isUnread
        }
    })
    return { unreadOrderCount, items }
}

export const getBusinessStoreMessagingNotificationSummary = async (businessUserId) => {
    const biz = await Business.findOne({ userId: businessUserId })
        .select('_id ordersNotificationReadAt category')
        .populate('category', 'name')
        .lean()
    if (!biz) {
        return { unreadCount: 0, items: [] }
    }
    const categorySlug = resolveBusinessCategorySlug(biz)
    const [msg, ord] = await Promise.all([
        getMessagingNotificationItemsForBusinessId(biz._id),
        listOrderNotificationItemsForBusiness(biz, {
            orderKind: categorySlug === 'resort' ? 'BOOKING' : 'ORDER'
        })
    ])
    const items = [...msg.items, ...ord.items].sort((a, b) => {
        const ta = new Date(a.previewAt || 0).getTime()
        const tb = new Date(b.previewAt || 0).getTime()
        return tb - ta
    })
    return { unreadCount: msg.unreadCount + ord.unreadOrderCount, items }
}

export const markAllBusinessStoreMessagingNotificationsRead = async (businessUserId) => {
    const biz = await Business.findOne({ userId: businessUserId }).select('_id').lean()
    if (!biz) {
        return { updated: 0 }
    }
    const now = new Date()
    const [convRes] = await Promise.all([
        StoreConversation.updateMany({ businessId: biz._id }, { $set: { businessLastReadAt: now } }),
        Business.updateOne({ _id: biz._id }, { $set: { ordersNotificationReadAt: now } })
    ])
    return { updated: convRes.modifiedCount }
}

export const assertSocketAccessToConversation = async ({ conversationId, userId, role }) => {
    const conv = await StoreConversation.findById(conversationId).lean()
    if (!conv) {
        throw new Error('CONVERSATION_NOT_FOUND')
    }
    if (role === 'TOURIST') {
        if (String(conv.touristUserId) !== String(userId)) {
            throw new Error('FORBIDDEN')
        }
        if (isInquiryConversation(conv)) {
            return conv
        }
        const order = await CustomerOrder.findById(conv.customerOrderId).select('status').lean()
        assertOrderAllowsTouristMessaging(order)
        return conv
    }
    if (role === 'BUSINESS') {
        const biz = await Business.findOne({ userId }).lean()
        if (!biz || String(biz._id) !== String(conv.businessId)) {
            throw new Error('FORBIDDEN')
        }
        return conv
    }
    throw new Error('FORBIDDEN')
}
