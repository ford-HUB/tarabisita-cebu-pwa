import { create } from 'zustand'
import { getMyTouristCustomerOrders } from '../../services/tourist/touristCustomerOrder.service.js'

export const useTouristOrdersStore = create((set) => ({
  orders: [],
  isLoading: false,
  errorMessage: null,
  loadOrders: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      const res = await getMyTouristCustomerOrders()
      const data = res?.data?.data
      const list = Array.isArray(data) ? data : []
      set({ orders: list, isLoading: false, errorMessage: null })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not load orders.'
      set({ isLoading: false, errorMessage: msg })
    }
  },
  refreshOrders: async () => {
    try {
      const res = await getMyTouristCustomerOrders()
      const data = res?.data?.data
      const list = Array.isArray(data) ? data : []
      set({ orders: list, errorMessage: null })
    } catch {
      /* keep existing rows on background refresh */
    }
  }
}))
