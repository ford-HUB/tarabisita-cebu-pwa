import mongoose from 'mongoose'
import CustomerOrder from '../../business/customer-orders/models/customer-order.model.js'
import RestaurantOrderReview from './models/restaurant-order-review.model.js'

/** Menu orders paid online (excludes pay-at-pickup / unpaid flows). */
export const ONLINE_PREPAID_BILLING_TYPES = new Set([
    'PREPAID_ONLINE',
    'GCASH',
    'MAYA',
    'GRAB_PAY',
    'CARD',
    'BANK_TRANSFER'
])

const roundRating = (n) => {
    const x = Number(n)
    if (!Number.isFinite(x)) return null
    return Math.round(x * 10) / 10
}

const authorLabelFromUser = (user) => {
    const name = String(user?.name || '').trim()
    if (!name) return 'Verified diner'
    const first = name.split(/\s+/)[0]
    return first.length > 24 ? `${first.slice(0, 24)}…` : first
}

/** Full display name for marketing surfaces (e.g. landing testimonials). */
const authorDisplayNameFromUser = (user) => {
    const name = String(user?.name || '').trim()
    if (!name) return 'Verified diner'
    return name.length > 72 ? `${name.slice(0, 71)}…` : name
}

const snippet = (text, max = 180) => {
    const s = String(text || '').trim().replace(/\s+/g, ' ')
    if (s.length <= max) return s
    return `${s.slice(0, max - 1)}…`
}

export const assertMenuOrderEligibleForRestaurantReview = (order) => {
    if (!order) throw new Error('ORDER_NOT_FOUND')
    if (String(order.orderType || 'MENU_ORDER').toUpperCase() !== 'MENU_ORDER') {
        throw new Error('REVIEW_NOT_ALLOWED_FOR_ORDER_TYPE')
    }
    if (String(order.status || '').toUpperCase() === 'CANCELED') {
        throw new Error('ORDER_NOT_REVIEWABLE')
    }
    const billing = String(order.billingType || '').toUpperCase()
    if (!ONLINE_PREPAID_BILLING_TYPES.has(billing)) {
        throw new Error('ORDER_NOT_REVIEWABLE')
    }
}

/**
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {import('mongoose').Types.ObjectId|string} customerOrderId
 * @param {{ rating: number, comment?: string }} body
 */
export const upsertRestaurantOrderReviewForTourist = async (userId, customerOrderId, { rating, comment = '' }) => {
    const uid = new mongoose.Types.ObjectId(String(userId))
    const oid = new mongoose.Types.ObjectId(String(customerOrderId))
    const order = await CustomerOrder.findById(oid).lean()
    if (!order || String(order.placedByUserId || '') !== String(uid)) {
        throw new Error('ORDER_NOT_FOUND')
    }
    assertMenuOrderEligibleForRestaurantReview(order)
    const r = Math.min(5, Math.max(1, Math.round(Number(rating))))
    if (!Number.isFinite(r)) {
        throw new Error('INVALID_RATING')
    }
    const trimmed = String(comment || '').trim().slice(0, 2000)

    const doc = await RestaurantOrderReview.findOneAndUpdate(
        { customerOrderId: oid },
        {
            $set: {
                userId: uid,
                businessId: order.businessId,
                rating: r,
                comment: trimmed
            }
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )

    return {
        id: String(doc._id),
        customerOrderId: String(doc.customerOrderId),
        businessId: String(doc.businessId),
        rating: doc.rating,
        comment: doc.comment || '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    }
}

export const getRestaurantOrderReviewForTouristOrder = async (userId, customerOrderId) => {
    const uid = new mongoose.Types.ObjectId(String(userId))
    const oid = new mongoose.Types.ObjectId(String(customerOrderId))
    const order = await CustomerOrder.findById(oid).lean()
    if (!order || String(order.placedByUserId || '') !== String(uid)) {
        throw new Error('ORDER_NOT_FOUND')
    }
    try {
        assertMenuOrderEligibleForRestaurantReview(order)
    } catch {
        return { eligible: false, review: null }
    }
    const review = await RestaurantOrderReview.findOne({ customerOrderId: oid }).lean()
    return {
        eligible: true,
        review: review
            ? {
                  id: String(review._id),
                  rating: review.rating,
                  comment: review.comment || '',
                  createdAt: review.createdAt,
                  updatedAt: review.updatedAt
              }
            : null
    }
}

/**
 * @param {Record<string, unknown>[]} orders — client-shaped orders with `id`
 */
export const mergeRestaurantReviewFlagsOntoOrders = async (orders) => {
    const list = Array.isArray(orders) ? orders : []
    const ids = list.map((o) => String(o?.id || '')).filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (!ids.length) return list
    const oids = ids.map((id) => new mongoose.Types.ObjectId(id))
    const rows = await RestaurantOrderReview.find({ customerOrderId: { $in: oids } })
        .select('customerOrderId rating')
        .lean()
    const byOrder = new Map(rows.map((r) => [String(r.customerOrderId), r]))
    return list.map((o) => {
        const id = String(o?.id || '')
        const hit = byOrder.get(id)
        return {
            ...o,
            restaurantReview: hit ? { rating: hit.rating } : null
        }
    })
}

const mapRecentReviewRow = (row) => ({
    id: String(row._id),
    rating: row.rating,
    comment: snippet(row.comment || ''),
    createdAt: row.createdAt,
    authorLabel: row.authorLabel || 'Verified diner'
})

/**
 * @param {import('mongoose').Types.ObjectId|string} businessId
 * @param {{ recentLimit?: number }} [opts]
 */
export const getRestaurantReviewPublicSummary = async (businessId, opts = {}) => {
    const recentLimit = Math.min(12, Math.max(0, Number(opts.recentLimit) || 6))
    const bid = new mongoose.Types.ObjectId(String(businessId))

    const [agg] = await RestaurantOrderReview.aggregate([
        { $match: { businessId: bid } },
        {
            $group: {
                _id: '$businessId',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ])

    const averageRating = agg?.reviewCount ? roundRating(agg.averageRating) : null
    const reviewCount = agg?.reviewCount ? Number(agg.reviewCount) : 0

    let recentReviews = []
    if (recentLimit > 0 && reviewCount > 0) {
        const recent = await RestaurantOrderReview.find({ businessId: bid })
            .sort({ createdAt: -1 })
            .limit(recentLimit)
            .populate('userId', 'name')
            .lean()

        recentReviews = recent.map((r) =>
            mapRecentReviewRow({
                ...r,
                authorLabel: authorLabelFromUser(r.userId)
            })
        )
    }

    return {
        averageRating,
        reviewCount,
        recentReviews
    }
}

/**
 * @param {import('mongoose').Types.ObjectId[]} businessIds
 * @returns {Promise<Map<string, { averageRating: number|null, reviewCount: number }>>}
 */
export const getRestaurantReviewStatsMapForBusinessIds = async (businessIds) => {
    const ids = (Array.isArray(businessIds) ? businessIds : [])
        .map((id) => (id && mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null))
        .filter(Boolean)
    const map = new Map()
    if (!ids.length) return map

    const rows = await RestaurantOrderReview.aggregate([
        { $match: { businessId: { $in: ids } } },
        {
            $group: {
                _id: '$businessId',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ])

    for (const r of rows) {
        map.set(String(r._id), {
            averageRating: r.reviewCount ? roundRating(r.averageRating) : null,
            reviewCount: Number(r.reviewCount) || 0
        })
    }
    return map
}

/**
 * Recent reviews for many businesses (cap per business in JS).
 * @param {import('mongoose').Types.ObjectId[]} businessIds
 * @param {{ perBusiness?: number }} [opts]
 */
export const getRestaurantRecentReviewsGrouped = async (businessIds, opts = {}) => {
    const perBusiness = Math.min(8, Math.max(1, Number(opts.perBusiness) || 3))
    const ids = (Array.isArray(businessIds) ? businessIds : [])
        .map((id) => (id && mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null))
        .filter(Boolean)
    const out = new Map()
    if (!ids.length) return out

    const recent = await RestaurantOrderReview.find({ businessId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(Math.min(200, ids.length * perBusiness * 4))
        .populate('userId', 'name')
        .lean()

    for (const id of ids) {
        out.set(String(id), [])
    }
    for (const r of recent) {
        const key = String(r.businessId)
        const bucket = out.get(key)
        if (!bucket || bucket.length >= perBusiness) continue
        bucket.push(
            mapRecentReviewRow({
                ...r,
                authorLabel: authorLabelFromUser(r.userId)
            })
        )
    }
    return out
}

const mapPublicReviewListItem = (row) => {
    const user = row.userId && typeof row.userId === 'object' ? row.userId : null
    const order = row.customerOrderId && typeof row.customerOrderId === 'object' ? row.customerOrderId : null
    return {
        id: String(row._id),
        rating: row.rating,
        comment: String(row.comment || '').trim(),
        createdAt: row.createdAt,
        authorLabel: authorLabelFromUser(user),
        avatarUrl: user?.avatar ? String(user.avatar).trim() || null : null,
        orderCode: order?.orderCode ? String(order.orderCode) : null,
        orderPlacedAt: order?.createdAt || null
    }
}

/**
 * Paginated public reviews for a business (menu orders). Caller must ensure the business is publicly listable.
 * @param {import('mongoose').Types.ObjectId|string} businessId
 * @param {{ sort?: string, rating?: number|null, page?: number, limit?: number }} [opts]
 */
export const listPublicRestaurantReviewsForBusiness = async (businessId, opts = {}) => {
    const bid = new mongoose.Types.ObjectId(String(businessId))
    const page = Math.max(1, Number(opts.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20))
    const skip = (page - 1) * limit
    const sortKey = String(opts.sort || 'newest').toLowerCase()
    const ratingFilter =
        opts.rating != null && opts.rating !== '' && Number.isFinite(Number(opts.rating))
            ? Math.min(5, Math.max(1, Math.round(Number(opts.rating))))
            : null

    const listMatch = { businessId: bid }
    if (ratingFilter != null) {
        listMatch.rating = ratingFilter
    }

    const sort =
        sortKey === 'highest'
            ? { rating: -1, createdAt: -1 }
            : sortKey === 'lowest'
              ? { rating: 1, createdAt: -1 }
              : { createdAt: -1 }

    const [agg] = await RestaurantOrderReview.aggregate([
        { $match: { businessId: bid } },
        {
            $group: {
                _id: '$businessId',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ])

    const averageRating = agg?.reviewCount ? roundRating(agg.averageRating) : null
    const reviewCount = agg?.reviewCount ? Number(agg.reviewCount) : 0

    const [filteredTotal, rows] = await Promise.all([
        RestaurantOrderReview.countDocuments(listMatch),
        RestaurantOrderReview.find(listMatch)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name avatar')
            .populate('customerOrderId', 'orderCode createdAt')
            .lean()
    ])

    return {
        summary: {
            averageRating,
            reviewCount
        },
        page,
        limit,
        total: filteredTotal,
        reviews: rows.map((r) => mapPublicReviewListItem(r))
    }
}

/**
 * Recent restaurant order reviews across many businesses (marketing landing).
 * De-duplicates per business so the carousel shows variety.
 * @param {import('mongoose').Types.ObjectId[]} businessObjectIds — caller-filtered public businesses
 * @param {{ limit?: number }} [opts]
 */
export const listPublicLandingRestaurantReviews = async (businessObjectIds, opts = {}) => {
    const limit = Math.min(24, Math.max(1, Number(opts.limit) || 12))
    const ids = (Array.isArray(businessObjectIds) ? businessObjectIds : [])
        .map((id) => (id && mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null))
        .filter(Boolean)
    if (!ids.length) {
        return { reviews: [] }
    }

    const rows = await RestaurantOrderReview.find({ businessId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(160)
        .populate('userId', 'name avatar')
        .populate('businessId', 'name')
        .lean()

    const mapped = []
    for (const r of rows) {
        const biz = r.businessId && typeof r.businessId === 'object' ? r.businessId : null
        if (!biz?._id) continue
        const user = r.userId && typeof r.userId === 'object' ? r.userId : null
        mapped.push({
            id: String(r._id),
            rating: r.rating,
            comment: snippet(String(r.comment || ''), 240),
            createdAt: r.createdAt,
            authorLabel: authorLabelFromUser(user),
            authorName: authorDisplayNameFromUser(user),
            avatarUrl: user?.avatar ? String(user.avatar).trim() || null : null,
            businessId: String(biz._id),
            businessName: String(biz.name || 'Restaurant').trim() || 'Restaurant'
        })
    }

    const score = (m) => (m.comment.length >= 12 ? 1000 : 0) + (Number(m.rating) >= 4 ? 100 : 0)
    mapped.sort((a, b) => score(b) - score(a) || new Date(b.createdAt) - new Date(a.createdAt))

    const out = []
    const perBusiness = new Map()
    for (const item of mapped) {
        const n = perBusiness.get(item.businessId) || 0
        if (n >= 2) continue
        perBusiness.set(item.businessId, n + 1)
        out.push(item)
        if (out.length >= limit) break
    }
    if (out.length < limit) {
        for (const item of mapped) {
            if (out.some((o) => o.id === item.id)) continue
            out.push(item)
            if (out.length >= limit) break
        }
    }

    return { reviews: out.slice(0, limit) }
}
