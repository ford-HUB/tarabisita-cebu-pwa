import {
  ActionModal,
  APPROVAL_STATUS,
  RequestApprovalTable,
  ReviewModal
} from '../../../components/ui/admin/request-approval'
import { useAdminRequestApproval } from '../../../hooks/useAdminRequestApproval.hook'

const RequestApproval = () => {
  const {
    search,
    statusFilter,
    selectedRequest,
    isApproveModalOpen,
    isDeclineModalOpen,
    isRevokeModalOpen,
    isLoading,
    isSubmittingAction,
    filteredRequests,
    setSearch,
    setStatusFilter,
    setIsApproveModalOpen,
    setIsDeclineModalOpen,
    setIsRevokeModalOpen,
    openReviewModal,
    closeAllModals,
    submitAction,
    submitRevoke
  } = useAdminRequestApproval()

  return (
    <div className="w-full space-y-5">
      <RequestApprovalTable
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={isLoading}
        requests={filteredRequests}
        onOpenReview={openReviewModal}
      />

      <ReviewModal
        request={selectedRequest}
        onClose={closeAllModals}
        onOpenApprove={() => setIsApproveModalOpen(true)}
        onOpenDecline={() => setIsDeclineModalOpen(true)}
        onOpenRevoke={() => setIsRevokeModalOpen(true)}
      />

      <ActionModal
        isOpen={isApproveModalOpen}
        title="Approve business request?"
        description="This will mark the business account as approved for platform visibility and operations."
        confirmLabel={isSubmittingAction ? 'Approving...' : 'Approve Request'}
        confirmClassName="bg-[#15803d] hover:bg-[#166534]"
        isSubmitting={isSubmittingAction}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={(notes) => submitAction(APPROVAL_STATUS.VERIFIED, notes)}
      />

      <ActionModal
        isOpen={isDeclineModalOpen}
        title="Decline business request?"
        description="This will mark the business account verification as declined."
        confirmLabel={isSubmittingAction ? 'Declining...' : 'Decline Request'}
        confirmClassName="bg-[#dc2626] hover:bg-[#b91c1c]"
        isSubmitting={isSubmittingAction}
        onClose={() => setIsDeclineModalOpen(false)}
        onConfirm={(notes) => submitAction(APPROVAL_STATUS.REJECTED, notes)}
      />

      <ActionModal
        isOpen={isRevokeModalOpen}
        title="Cancel business approval"
        description="Are you sure you want to revoke this business approval? The business partner will lose approved access and may return to pending or restricted status."
        confirmLabel={isSubmittingAction ? 'Processing…' : 'Confirm cancel approval'}
        cancelLabel="Keep approval"
        confirmClassName="bg-amber-600 hover:bg-amber-700"
        showNotes
        isSubmitting={isSubmittingAction}
        onClose={() => setIsRevokeModalOpen(false)}
        onConfirm={(notes) => submitRevoke(notes)}
      />
    </div>
  )
}

export default RequestApproval
