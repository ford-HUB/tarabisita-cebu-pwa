import { create } from 'zustand'
import {
  getBusinessStoreMessagingNotifications,
  postBusinessStoreMessagingNotificationsRead
} from '../../services/business/store-messaging.service.js'

export const useBusinessStoreNotificationsStore = create((set, get) => ({
  unreadCount: 0,
  items: [],
  isLoading: false,
  errorMessage: null,

  fetchSummary: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      const res = await getBusinessStoreMessagingNotifications()
      const payload = res.data?.data
      const unreadCount = Number(payload?.unreadCount) || 0
      const items = Array.isArray(payload?.items) ? payload.items : []
      set({ unreadCount, items, isLoading: false, errorMessage: null })
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Could not load notifications.'
      set({ unreadCount: 0, items: [], isLoading: false, errorMessage: msg })
    }
  },

  markAllRead: async () => {
    try {
      await postBusinessStoreMessagingNotificationsRead()
    } catch {
      // still refresh so the badge reflects server state
    }
    await get().fetchSummary()
  },

  /** Call after opening a customer thread so the badge updates without waiting for the poll. */
  refresh: async () => {
    await get().fetchSummary()
  }
}))
