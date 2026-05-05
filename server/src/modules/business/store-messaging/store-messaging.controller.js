import {
    deleteBusinessConversation,
    getBusinessStoreMessagingNotificationSummary,
    listBusinessConversations,
    markAllBusinessStoreMessagingNotificationsRead,
    resolveBusinessMessagingThread
} from '../../tourist/store-messaging/store-messaging.service.js'

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
    if (code === 'BUSINESS_NOT_FOUND') return { status: 404, message: 'Business profile not found.' }
    return { status: 500, message: error?.message || 'Something went wrong.' }
}

export const getBusinessStoreMessagingConversationsHandler = async (req, res) => {
    try {
        const data = await listBusinessConversations(req.user._id)
        return noStoreJson(res, { data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not load conversations.' })
    }
}

export const getBusinessStoreMessagingNotificationsHandler = async (req, res) => {
    try {
        const data = await getBusinessStoreMessagingNotificationSummary(req.user._id)
        return noStoreJson(res, { data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not load notifications.' })
    }
}

export const markBusinessStoreMessagingNotificationsReadHandler = async (req, res) => {
    try {
        const data = await markAllBusinessStoreMessagingNotificationsRead(req.user._id)
        return noStoreJson(res, { data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not update notifications.' })
    }
}

export const getBusinessStoreMessagingThreadHandler = async (req, res) => {
    try {
        const { conversationId } = req.validatedData.query
        const data = await resolveBusinessMessagingThread(req.user._id, conversationId)
        return noStoreJson(res, { data })
    } catch (error) {
        const mapped = mapErr(error)
        return res.status(mapped.status).json({ message: mapped.message })
    }
}

export const deleteBusinessStoreMessagingConversationHandler = async (req, res) => {
    try {
        const { conversationId } = req.validatedData.query
        const data = await deleteBusinessConversation(req.user._id, conversationId)
        return noStoreJson(res, { data })
    } catch (error) {
        const mapped = mapErr(error)
        return res.status(mapped.status).json({ message: mapped.message })
    }
}
