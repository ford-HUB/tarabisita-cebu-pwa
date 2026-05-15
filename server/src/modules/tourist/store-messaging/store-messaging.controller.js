import {
    createStoreMessagingLinkToken,
    listTouristConversations,
    resolveTouristMessagingSession,
    resolveTouristMessagingThread
} from './store-messaging.service.js'

const noStoreJson = (res, payload) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache'
    })
    return res.status(200).json(payload)
}

const mapErr = (error) => {
    const code = String(error?.message || '')
    if (code === 'CONVERSATION_NOT_FOUND' || code === 'INVALID_CONVERSATION_ID') {
        return { status: 404, message: 'Conversation not found.' }
    }
    if (code === 'ORDER_NOT_FOUND') return { status: 404, message: 'Order not found.' }
    if (code === 'ORDER_MESSAGING_CLOSED') {
        return { status: 404, message: 'This chat is closed because the order is finished or canceled.' }
    }
    if (code === 'INVALID_IDS') return { status: 400, message: 'Invalid request.' }
    if (code === 'BUSINESS_NOT_FOUND') return { status: 404, message: 'This listing was not found.' }
    if (code === 'INQUIRY_MESSAGING_NOT_AVAILABLE') {
        return {
            status: 400,
            message: 'Direct messaging from a listing is only available for restaurants, resorts, and hotels.'
        }
    }
    if (code === 'INVALID_MESSAGING_TOKEN' || code === 'MESSAGING_TOKEN_EXPIRED' || code === 'MESSAGING_TOKEN_MISMATCH') {
        return { status: 400, message: 'This chat link is invalid or has expired. Open a new chat from your order.' }
    }
    return { status: 500, message: error?.message || 'Something went wrong.' }
}

export const postStoreMessagingLinkTokenHandler = async (req, res) => {
    try {
        const { businessId, customerOrderId } = req.validatedData.body
        const data = await createStoreMessagingLinkToken(req.user._id, { businessId, customerOrderId })
        return noStoreJson(res, { data })
    } catch (error) {
        const m = mapErr(error)
        return res.status(m.status).json({ message: m.message })
    }
}

export const getStoreMessagingSessionHandler = async (req, res) => {
    try {
        const { m } = req.validatedData.query
        const data = await resolveTouristMessagingSession(req.user._id, m)
        return noStoreJson(res, { data })
    } catch (error) {
        const mapped = mapErr(error)
        return res.status(mapped.status).json({ message: mapped.message })
    }
}

export const getStoreMessagingThreadHandler = async (req, res) => {
    try {
        const { conversationId } = req.validatedData.query
        const data = await resolveTouristMessagingThread(req.user._id, conversationId)
        return noStoreJson(res, { data })
    } catch (error) {
        const mapped = mapErr(error)
        return res.status(mapped.status).json({ message: mapped.message })
    }
}

export const getStoreMessagingConversationsHandler = async (req, res) => {
    try {
        const data = await listTouristConversations(req.user._id)
        return noStoreJson(res, { data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not load conversations.' })
    }
}
