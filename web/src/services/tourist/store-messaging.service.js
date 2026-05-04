import { apiInstance } from '../../api/_base_.js'

export const postStoreMessagingLinkToken = (body) =>
  apiInstance.post('tourist/store-messaging/link-token', body)

export const getStoreMessagingSession = (m) =>
  apiInstance.get('tourist/store-messaging/session', { params: { m } })

export const getStoreMessagingThread = (conversationId) =>
  apiInstance.get('tourist/store-messaging/thread', { params: { conversationId } })

export const getStoreMessagingConversations = () => apiInstance.get('tourist/store-messaging/conversations')
