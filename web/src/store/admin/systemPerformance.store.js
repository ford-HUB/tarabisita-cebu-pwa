import { create } from 'zustand'
import { toast } from 'sonner'
import { getAdminSystemPerformanceSnapshot } from '../../services/admin/systemPerformance.service'

const initialSnapshot = {
  timestamp: null,
  uptimeSeconds: 0,
  memory: { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 },
  cpu: { loadAverage1m: 0, loadAverage5m: 0, loadAverage15m: 0 },
  eventLoop: { meanMs: 0, maxMs: 0, p95Ms: 0 },
  http: { requestsLastMinute: 0, avgResponseMs: 0, p95ResponseMs: 0, minResponseMs: 0, maxResponseMs: 0 },
  responseTimeSeries: [],
  logs: []
}

export const useAdminSystemPerformanceStore = create((set) => ({
  snapshot: initialSnapshot,
  isLoading: true,
  errorMessage: '',
  isSocketConnected: false,

  setSnapshot: (snapshot) => set({ snapshot }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setIsSocketConnected: (isSocketConnected) => set({ isSocketConnected }),

  fetchSnapshot: async () => {
    set({ isLoading: true, errorMessage: '' })
    try {
      const response = await getAdminSystemPerformanceSnapshot()
      set({
        snapshot: response?.data?.data || initialSnapshot,
        isLoading: false
      })
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load system performance.'
      toast.error(message)
      set({ isLoading: false, errorMessage: message })
    }
  }
}))
