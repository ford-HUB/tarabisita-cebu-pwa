import { create } from 'zustand'
import { toast } from 'sonner'
import { getAdminPlanSubscriptionTransactions } from '../../services/admin/businessOperations.service'

const mapRow = (item) => ({
  id: item?.id || '',
  orderId: item?.orderId || '—',
  businessName: item?.businessName || '—',
  customerName: item?.customerName || '—',
  email: item?.email || '—',
  amount: item?.amount,
  currency: item?.currency || 'PHP',
  planId: item?.planId || '',
  months: item?.months,
  status: item?.status || 'PENDING',
  paidAt: item?.paidAt,
  createdAt: item?.createdAt,
  subscriptionEndsAt: item?.subscriptionEndsAt
})

export const useAdminTransactionsStore = create((set) => ({
  rawRows: [],
  isLoading: true,
  sortKey: 'createdAt',
  sortDir: 'desc',
  selectedIds: new Set(),

  setRawRows: (updater) =>
    set((s) => ({
      rawRows: typeof updater === 'function' ? updater(s.rawRows) : updater
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSortKey: (updater) =>
    set((s) => ({
      sortKey: typeof updater === 'function' ? updater(s.sortKey) : updater
    })),
  setSortDir: (updater) =>
    set((s) => ({
      sortDir: typeof updater === 'function' ? updater(s.sortDir) : updater
    })),
  setSelectedIds: (updater) =>
    set((s) => ({
      selectedIds: typeof updater === 'function' ? updater(s.selectedIds) : updater
    })),

  toggleSort: (key) =>
    set((s) => {
      if (s.sortKey === key) {
        return { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
      }
      return { sortKey: key, sortDir: 'asc' }
    }),

  fetchTransactions: async ({ period, paymentStatus }) => {
    set({ isLoading: true })
    try {
      const response = await getAdminPlanSubscriptionTransactions({
        days: period,
        status: paymentStatus
      })
      const records = response?.data?.data || []
      set({ rawRows: records.map(mapRow), selectedIds: new Set(), isLoading: false })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load transactions.')
      set({ rawRows: [], isLoading: false })
    }
  }
}))
