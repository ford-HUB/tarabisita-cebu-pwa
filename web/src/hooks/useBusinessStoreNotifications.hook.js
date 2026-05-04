import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBusinessStoreNotificationsStore } from '../store/business/business-store-notifications.store.js'

const POLL_MS = 20000

export const useBusinessStoreNotifications = () => {
  const { unreadCount, items, isLoading, errorMessage, fetchSummary, markAllRead } =
    useBusinessStoreNotificationsStore(
      useShallow((s) => ({
        unreadCount: s.unreadCount,
        items: s.items,
        isLoading: s.isLoading,
        errorMessage: s.errorMessage,
        fetchSummary: s.fetchSummary,
        markAllRead: s.markAllRead
      }))
    )

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    const id = setInterval(() => {
      void fetchSummary()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [fetchSummary])

  useEffect(() => {
    const onFocus = () => void fetchSummary()
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchSummary()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fetchSummary])

  return {
    unreadCount,
    notificationItems: items,
    notificationsLoading: isLoading,
    notificationsError: errorMessage,
    refreshNotifications: fetchSummary,
    /** Refresh list while the panel is open (e.g. after a new message). */
    onNotificationsPanelOpened: () => void fetchSummary(),
    /** Mark store messages as read for the business once the panel is dismissed. */
    onNotificationsPanelClosed: () => void markAllRead()
  }
}
