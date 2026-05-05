import { create } from 'zustand'
import { toast } from 'sonner'
import { getMyTrafficInsights } from '../../services/business/trafficInsights.service.js'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Failed to load traffic insights.'

export const useTrafficInsightsStore = create((set) => ({
  data: null,
  selectedDate: '',
  isLoading: false,
  errorMessage: '',

  setSelectedDate: (date) => set({ selectedDate: String(date || '') }),

  loadInsights: async (date) => {
    set({ isLoading: true, errorMessage: '' })
    try {
      const response = await getMyTrafficInsights(date)
      set({ data: response?.data?.data || null, isLoading: false, errorMessage: '' })
    } catch (error) {
      const message = readErrorMessage(error)
      set({ data: null, isLoading: false, errorMessage: message })
      toast.error(message)
    }
  }
}))
