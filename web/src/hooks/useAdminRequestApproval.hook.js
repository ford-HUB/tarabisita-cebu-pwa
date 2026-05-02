import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { APPROVAL_STATUS } from '../components/ui/admin/request-approval'
import {
  getBusinessApprovalQueue,
  updateBusinessApprovalStatus
} from '../services/business/business.service'

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

export const useAdminRequestApproval = () => {
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const loadQueue = async (status = statusFilter) => {
    try {
      setIsLoading(true)
      const response = await getBusinessApprovalQueue(status)
      const records = response?.data?.data || []
      setRequests(records.map(mapRequest))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load approval requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue(statusFilter)
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
    setSelectedRequest(request)
    setIsApproveModalOpen(false)
    setIsDeclineModalOpen(false)
  }

  const closeAllModals = () => {
    setSelectedRequest(null)
    setIsApproveModalOpen(false)
    setIsDeclineModalOpen(false)
  }

  const submitAction = async (status, notes = '') => {
    if (!selectedRequest?.id) return
    const trimmedNotes = typeof notes === 'string' ? notes.trim() : ''
    try {
      setIsSubmittingAction(true)
      const response = await updateBusinessApprovalStatus({
        businessId: selectedRequest.id,
        status,
        notes: trimmedNotes
      })
      const updated = mapRequest(response?.data?.data || {})
      setRequests((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setSelectedRequest((current) => (current ? { ...current, ...updated } : current))
      setIsApproveModalOpen(false)
      setIsDeclineModalOpen(false)
      if (status === APPROVAL_STATUS.VERIFIED) {
        setSelectedRequest(null)
      }
      toast.success(`Request ${status === APPROVAL_STATUS.VERIFIED ? 'approved' : 'declined'} successfully.`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update request.')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  return {
    search,
    statusFilter,
    selectedRequest,
    isApproveModalOpen,
    isDeclineModalOpen,
    isLoading,
    isSubmittingAction,
    filteredRequests,
    setSearch,
    setStatusFilter,
    setIsApproveModalOpen,
    setIsDeclineModalOpen,
    openReviewModal,
    closeAllModals,
    submitAction
  }
}
