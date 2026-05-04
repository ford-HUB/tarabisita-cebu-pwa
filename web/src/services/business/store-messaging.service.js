import { apiInstance } from '../../api/_base_.js'

export const getBusinessStoreMessagingConversations = () =>
  apiInstance.get('business/me/store-messaging/conversations')

export const getBusinessStoreMessagingThread = (conversationId) =>
  apiInstance.get('business/me/store-messaging/thread', { params: { conversationId } })

export const getBusinessStoreMessagingNotifications = () =>
  apiInstance.get('business/me/store-messaging/notifications')

export const postBusinessStoreMessagingNotificationsRead = () =>
  apiInstance.post('business/me/store-messaging/notifications/read')
