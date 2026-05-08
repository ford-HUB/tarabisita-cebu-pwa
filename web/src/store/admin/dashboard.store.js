import { create } from 'zustand'
import { toast } from 'sonner'
import { getAdminDashboardSnapshot } from '../../services/admin/dashboard.service'

const initialSnapshot = {
  users: {
    total: 0,
    tourists: 0,
    businessOwners: 0,
    admins: 0
  },
  partners: [],
  approvals: [],
  transactions: []
}

export const useAdminDashboardStore = create((set) => ({
  snapshot: initialSnapshot,
  isLoading: true,
  lastUpdatedAt: null,

  setSnapshot: (snapshot) => set({ snapshot }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),

  fetchSnapshot: async () => {
    set({ isLoading: true })
    try {
      const snapshot = await getAdminDashboardSnapshot()
      set({
        snapshot,
        isLoading: false,
        lastUpdatedAt: new Date().toISOString()
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load admin dashboard analytics.')
      set({
        snapshot: initialSnapshot,
        isLoading: false
      })
    }
  }
}))
