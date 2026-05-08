import { create } from 'zustand'
import { toast } from 'sonner'
import {
  advanceMyCustomerOrder,
  advanceMyResortBookingRecord,
  cancelMyCustomerOrder,
  cancelMyResortBookingRecord,
  getMyCustomerOrders,
  getMyResortBookingRecords
} from '../../services/business/customerOrders.service'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

export const useCustomerOrdersStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  isResortBusiness: false,

  loadOrders: async ({ isResortBusiness = false } = {}) => {
    set({ isLoading: true, isResortBusiness: Boolean(isResortBusiness) })
    try {
      const response = isResortBusiness ? await getMyResortBookingRecords() : await getMyCustomerOrders()
      const rows = response?.data?.data
      set({ orders: Array.isArray(rows) ? rows : [], isLoading: false })
    } catch (error) {
      const message = readErrorMessage(error)
      if (error?.response?.status === 403) {
        set({ orders: [], isLoading: false })
        toast.error(message)
        return
      }
      set({ orders: [], isLoading: false })
      toast.error(message)
    }
  },

  advanceOrderStatus: async (orderId) => {
    try {
      const response = get().isResortBusiness
        ? await advanceMyResortBookingRecord(orderId)
        : await advanceMyCustomerOrder(orderId)
      const updated = response?.data?.data
      if (!updated?.id) return
      set((state) => ({
        orders: state.orders.map((order) => (order.id === updated.id ? { ...order, ...updated } : order))
      }))
    } catch (error) {
      toast.error(readErrorMessage(error))
      await get().loadOrders({ isResortBusiness: get().isResortBusiness })
    }
  },

  cancelOrder: async (orderId, reasonText) => {
    try {
      const response = get().isResortBusiness
        ? await cancelMyResortBookingRecord(orderId, reasonText)
        : await cancelMyCustomerOrder(orderId, reasonText)
      const updated = response?.data?.data
      if (!updated?.id) return
      set((state) => ({
        orders: state.orders.map((order) => (order.id === updated.id ? { ...order, ...updated } : order))
      }))
    } catch (error) {
      toast.error(readErrorMessage(error))
      await get().loadOrders({ isResortBusiness: get().isResortBusiness })
    }
  }
}))
