import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getAdminPlanSubscriptionTransactions,
  getAdminPlanSubscriptionPaymentDetail,
  postAdminPlanSubscriptionPaymentApprove,
  postAdminPlanSubscriptionPaymentReject
} from '../../services/admin/businessOperations.service'

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
  updatedAt: item?.updatedAt,
  subscriptionEndsAt: item?.subscriptionEndsAt
})

export const useAdminTransactionsStore = create((set, get) => ({
  rawRows: [],
  isLoading: true,
  lastPeriod: '7',
  lastPaymentStatus: 'ALL',
  sortKey: 'createdAt',
  sortDir: 'desc',
  selectedIds: new Set(),

  reviewPaymentId: null,
  paymentDetail: null,
  paymentDetailLoading: false,
  paymentDetailError: null,
  paymentActionBusy: false,

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

  openPaymentReview: (paymentId) => {
    set({
      reviewPaymentId: paymentId,
      paymentDetail: null,
      paymentDetailError: null,
      paymentDetailLoading: true
    })
    void get().loadPaymentDetail(paymentId)
  },

  closePaymentReview: () =>
    set({
      reviewPaymentId: null,
      paymentDetail: null,
      paymentDetailError: null,
      paymentDetailLoading: false,
      paymentActionBusy: false
    }),

  loadPaymentDetail: async (paymentId) => {
    const id = String(paymentId || '').trim()
    if (!id) return
    set({ paymentDetailLoading: true, paymentDetailError: null })
    try {
      const response = await getAdminPlanSubscriptionPaymentDetail(id)
      const data = response?.data?.data ?? null
      set({ paymentDetail: data, paymentDetailLoading: false })
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load payment.'
      toast.error(message)
      set({ paymentDetail: null, paymentDetailLoading: false, paymentDetailError: message })
    }
  },

  fetchTransactions: async ({ period, paymentStatus }) => {
    set({ isLoading: true, lastPeriod: period, lastPaymentStatus: paymentStatus })
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
  },

  approvePaymentReview: async () => {
    const id = get().reviewPaymentId
    if (!id) return
    set({ paymentActionBusy: true })
    try {
      await postAdminPlanSubscriptionPaymentApprove(id)
      toast.success('Payment approved. The business owner was notified by email.')
      get().closePaymentReview()
      const { lastPeriod, lastPaymentStatus } = get()
      await get().fetchTransactions({ period: lastPeriod, paymentStatus: lastPaymentStatus })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not approve payment.')
    } finally {
      set({ paymentActionBusy: false })
    }
  },

  rejectPaymentReview: async (reason) => {
    const id = get().reviewPaymentId
    if (!id) return
    set({ paymentActionBusy: true })
    try {
      await postAdminPlanSubscriptionPaymentReject(id, { reason: String(reason || '').trim() })
      toast.success('Payment declined. The business owner was notified by email.')
      get().closePaymentReview()
      const { lastPeriod, lastPaymentStatus } = get()
      await get().fetchTransactions({ period: lastPeriod, paymentStatus: lastPaymentStatus })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not decline payment.')
    } finally {
      set({ paymentActionBusy: false })
    }
  }
}))
