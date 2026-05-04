import { create } from 'zustand'
import { toast } from 'sonner'
import {
  advanceMyCustomerOrder,
  cancelMyCustomerOrder,
  getMyCustomerOrders
} from '../../services/business/customerOrders.service'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

export const useCustomerOrdersStore = create((set, get) => ({
  orders: [],
  isLoading: false,

  loadOrders: async () => {
    set({ isLoading: true })
    try {
      const response = await getMyCustomerOrders()
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
      const response = await advanceMyCustomerOrder(orderId)
      const updated = response?.data?.data
      if (!updated?.id) return
      set((state) => ({
        orders: state.orders.map((order) => (order.id === updated.id ? { ...order, ...updated } : order))
      }))
    } catch (error) {
      toast.error(readErrorMessage(error))
      await get().loadOrders()
    }
  },

  cancelOrder: async (orderId, reasonText) => {
    try {
      const response = await cancelMyCustomerOrder(orderId, reasonText)
      const updated = response?.data?.data
      if (!updated?.id) return
      set((state) => ({
        orders: state.orders.map((order) => (order.id === updated.id ? { ...order, ...updated } : order))
      }))
    } catch (error) {
      toast.error(readErrorMessage(error))
      await get().loadOrders()
    }
  }
}))
