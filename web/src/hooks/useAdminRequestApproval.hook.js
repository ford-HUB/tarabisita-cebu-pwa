import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { buildRequestApprovalCsv } from '../components/ui/admin/request-approval/utils'
import { useAdminRequestApprovalStore } from '../store/admin/requestApproval.store'

export const useAdminRequestApproval = () => {
  const {
    requests,
    search,
    statusFilter,
    selectedRequest,
    isApproveModalOpen,
    isDeclineModalOpen,
    isRevokeModalOpen,
    isLoading,
    isSubmittingAction
  } = useAdminRequestApprovalStore(
    useShallow((s) => ({
      requests: s.requests,
      search: s.search,
      statusFilter: s.statusFilter,
      selectedRequest: s.selectedRequest,
      isApproveModalOpen: s.isApproveModalOpen,
      isDeclineModalOpen: s.isDeclineModalOpen,
      isRevokeModalOpen: s.isRevokeModalOpen,
      isLoading: s.isLoading,
      isSubmittingAction: s.isSubmittingAction
    }))
  )

  useEffect(() => {
    void useAdminRequestApprovalStore.getState().fetchQueue(statusFilter)
  }, [statusFilter])

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return requests
    return requests.filter((request) =>
      [request.businessName, request.ownerName, request.id].some((value) =>
        String(value).toLowerCase().includes(keyword)
      )
    )
  }, [requests, search])

  const openReviewModal = (request) => {
    const store = useAdminRequestApprovalStore.getState()
    store.setSelectedRequest(request)
    store.setIsApproveModalOpen(false)
    store.setIsDeclineModalOpen(false)
    store.setIsRevokeModalOpen(false)
  }

  const closeAllModals = () => {
    const store = useAdminRequestApprovalStore.getState()
    store.setSelectedRequest(null)
    store.setIsApproveModalOpen(false)
    store.setIsDeclineModalOpen(false)
    store.setIsRevokeModalOpen(false)
  }

  const submitAction = async (status, notes = '') => {
    await useAdminRequestApprovalStore.getState().submitApprovalDecision({ status, notes })
  }

  const submitRevoke = async (notes = '') => {
    await useAdminRequestApprovalStore.getState().submitRevokeApproval({ notes })
  }

  const exportCsv = useCallback(() => {
    if (!filteredRequests.length) {
      toast.message('Nothing to export for the current filter.')
      return
    }
    const csv = buildRequestApprovalCsv(filteredRequests)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `business-verification-requests-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded.')
  }, [filteredRequests])

  return {
    search,
    statusFilter,
    selectedRequest,
    isApproveModalOpen,
    isDeclineModalOpen,
    isRevokeModalOpen,
    isLoading,
    isSubmittingAction,
    filteredRequests,
    setSearch: (v) => useAdminRequestApprovalStore.getState().setSearch(v),
    setStatusFilter: (v) => useAdminRequestApprovalStore.getState().setStatusFilter(v),
    setIsApproveModalOpen: (v) => useAdminRequestApprovalStore.getState().setIsApproveModalOpen(v),
    setIsDeclineModalOpen: (v) => useAdminRequestApprovalStore.getState().setIsDeclineModalOpen(v),
    setIsRevokeModalOpen: (v) => useAdminRequestApprovalStore.getState().setIsRevokeModalOpen(v),
    openReviewModal,
    closeAllModals,
    submitAction,
    submitRevoke,
    exportCsv
  }
}
