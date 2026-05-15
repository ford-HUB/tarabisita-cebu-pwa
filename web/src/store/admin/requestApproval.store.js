import { create } from 'zustand'
import { toast } from 'sonner'
import { APPROVAL_STATUS } from '../../components/ui/admin/request-approval'
import {
  getBusinessApprovalQueue,
  updateBusinessApprovalStatus
} from '../../services/admin/businessOperations.service'

const mapRequest = (item) => ({
  id: item?._id || '',
  businessName: item?.name || 'Unnamed Business',
  ownerName: item?.ownerName || '-',
  ownerEmail: item?.ownerEmail || '-',
  phone: item?.phone || '-',
  category: item?.category || '-',
  submittedAt: item?.createdAt,
  status: item?.verificationStatus || APPROVAL_STATUS.PENDING,
  address: item?.address || '-',
  logo: item?.logo || '',
  verificationProofs: item?.verificationProofs || [],
  verificationNotes:
    typeof item?.verificationNotes === 'string' ? item.verificationNotes.trim() : item?.verificationNotes || ''
})

export const useAdminRequestApprovalStore = create((set, get) => ({
  requests: [],
  search: '',
  statusFilter: 'ALL',
  selectedRequest: null,
  isApproveModalOpen: false,
  isDeclineModalOpen: false,
  isRevokeModalOpen: false,
  isLoading: true,
  isSubmittingAction: false,

  setRequests: (updater) =>
    set((s) => ({
      requests: typeof updater === 'function' ? updater(s.requests) : updater
    })),
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedRequest: (updater) =>
    set((s) => ({
      selectedRequest:
        typeof updater === 'function' ? updater(s.selectedRequest) : updater
    })),
  setIsApproveModalOpen: (isApproveModalOpen) => set({ isApproveModalOpen }),
  setIsDeclineModalOpen: (isDeclineModalOpen) => set({ isDeclineModalOpen }),
  setIsRevokeModalOpen: (isRevokeModalOpen) => set({ isRevokeModalOpen }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSubmittingAction: (isSubmittingAction) => set({ isSubmittingAction }),

  fetchQueue: async (status) => {
    set({ isLoading: true })
    try {
      const response = await getBusinessApprovalQueue(status)
      const records = response?.data?.data || []
      set({ requests: records.map(mapRequest), isLoading: false })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load approval requests.')
      set({ isLoading: false })
    }
  },

  submitApprovalDecision: async ({ status, notes = '' }) => {
    const current = get().selectedRequest
    if (!current?.id) return { ok: false }
    const trimmedNotes = typeof notes === 'string' ? notes.trim() : ''
    set({ isSubmittingAction: true })
    try {
      const response = await updateBusinessApprovalStatus({
        businessId: current.id,
        status,
        notes: trimmedNotes
      })
      const updated = mapRequest(response?.data?.data || {})
      set((s) => {
        const mergedSelected = s.selectedRequest ? { ...s.selectedRequest, ...updated } : s.selectedRequest
        return {
          requests: s.requests.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
          selectedRequest: status === APPROVAL_STATUS.VERIFIED ? null : mergedSelected,
          isApproveModalOpen: false,
          isDeclineModalOpen: false
        }
      })
      toast.success(`Request ${status === APPROVAL_STATUS.VERIFIED ? 'approved' : 'declined'} successfully.`)
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update request.')
      return { ok: false }
    } finally {
      set({ isSubmittingAction: false })
    }
  },

  submitRevokeApproval: async ({ notes = '' }) => {
    const current = get().selectedRequest
    if (!current?.id || current.status !== APPROVAL_STATUS.VERIFIED) return { ok: false }
    const trimmedNotes = typeof notes === 'string' ? notes.trim() : ''
    set({ isSubmittingAction: true })
    try {
      const response = await updateBusinessApprovalStatus({
        businessId: current.id,
        status: APPROVAL_STATUS.PENDING,
        notes: trimmedNotes,
        revoke: true
      })
      const updated = mapRequest(response?.data?.data || {})
      set((s) => {
        const mergedSelected = s.selectedRequest ? { ...s.selectedRequest, ...updated } : s.selectedRequest
        return {
          requests: s.requests.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
          selectedRequest: mergedSelected,
          isRevokeModalOpen: false,
          isApproveModalOpen: false,
          isDeclineModalOpen: false
        }
      })
      toast.success('Business approval revoked. The partner was notified by email.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to revoke approval.')
      return { ok: false }
    } finally {
      set({ isSubmittingAction: false })
    }
  }
}))
