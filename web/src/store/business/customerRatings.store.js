import { create } from 'zustand'
import { toast } from 'sonner'
import { getMyCustomerRatings } from '../../services/business/customerRatings.service.js'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Failed to load customer ratings.'

export const useCustomerRatingsStore = create((set) => ({
  data: null,
  sentiment: 'all',
  page: 1,
  isLoading: false,
  errorMessage: '',

  setSentiment: (sentiment) => set({ sentiment: String(sentiment || 'all'), page: 1 }),
  setPage: (page) => set({ page: Math.max(1, Number(page) || 1) }),

  loadRatings: async ({ page, sentiment } = {}) => {
    set({ isLoading: true, errorMessage: '' })
    try {
      const response = await getMyCustomerRatings({ page, limit: 20, sentiment })
      set({ data: response?.data?.data || null, isLoading: false, errorMessage: '' })
    } catch (error) {
      const message = readErrorMessage(error)
      set({ data: null, isLoading: false, errorMessage: message })
      toast.error(message)
    }
  }
}))
