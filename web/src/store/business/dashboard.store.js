import { create } from 'zustand'
import { toast } from 'sonner'
import { getMyBusinessDashboard } from '../../services/business/dashboard.service.js'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Failed to load dashboard summary.'

export const useBusinessDashboardStore = create((set) => ({
  data: null,
  selectedYear: null,
  selectedMonth: '',
  isLoading: false,
  errorMessage: '',

  setSelectedYear: (year) => set({ selectedYear: year ? Number(year) : null }),
  setSelectedMonth: (month) => set({ selectedMonth: String(month || '') }),

  loadDashboard: async ({ year, month } = {}) => {
    set({ isLoading: true, errorMessage: '' })
    try {
      const response = await getMyBusinessDashboard({ year, month })
      const payload = response?.data?.data || null
      set({
        data: payload,
        isLoading: false,
        errorMessage: '',
        selectedYear: payload?.year ?? null,
        selectedMonth: payload?.month || ''
      })
    } catch (error) {
      const message = readErrorMessage(error)
      const status = error?.response?.status
      if (status !== 403) {
        toast.error(message)
      }
      set({ isLoading: false, errorMessage: message, data: null })
    }
  }
}))
