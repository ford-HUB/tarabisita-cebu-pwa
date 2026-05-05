import { create } from 'zustand'
import { toast } from 'sonner'
import { getMyDailySalesReport } from '../../services/business/dailySalesReport.service.js'

const readErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Failed to load daily sales report.'

export const useDailySalesReportStore = create((set) => ({
  report: null,
  selectedDate: '',
  isLoading: false,
  errorMessage: '',

  setSelectedDate: (date) => set({ selectedDate: String(date || '') }),

  loadReport: async (date) => {
    set({ isLoading: true, errorMessage: '' })
    try {
      const response = await getMyDailySalesReport(date)
      set({
        report: response?.data?.data || null,
        isLoading: false,
        errorMessage: ''
      })
    } catch (error) {
      const message = readErrorMessage(error)
      set({ isLoading: false, errorMessage: message, report: null })
      toast.error(message)
    }
  }
}))
