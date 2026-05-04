import { useBusinessStoreNotifications } from './useBusinessStoreNotifications.hook.js'

/** Full-page notifications: same data source as the top bar inbox. */
export const useBusinessNotificationsPage = () => {
  const {
    unreadCount,
    notificationItems,
    notificationsLoading,
    notificationsError
  } = useBusinessStoreNotifications()

  return {
    unreadCount,
    items: notificationItems,
    isLoading: notificationsLoading,
    errorMessage: notificationsError
  }
}
