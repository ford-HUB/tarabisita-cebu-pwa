const ReviewModalFooter = ({
  activeStep,
  actionsDisabled,
  onPrevious,
  onNext,
  onClose,
  onOpenDecline,
  onOpenApprove
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0e7dd] px-5 py-4">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={activeStep === 0}
        className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={activeStep === 1}
        className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
      >
        Close
      </button>
      <button
        type="button"
        onClick={onOpenDecline}
        disabled={actionsDisabled}
        aria-disabled={actionsDisabled}
        title={actionsDisabled ? 'This request is already approved.' : undefined}
        className="rounded-full bg-[#dc2626] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#dc2626]"
      >
        Decline
      </button>
      <button
        type="button"
        onClick={onOpenApprove}
        disabled={actionsDisabled}
        aria-disabled={actionsDisabled}
        title={actionsDisabled ? 'This request is already approved.' : undefined}
        className="rounded-full bg-[#15803d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#15803d]"
      >
        Approve
      </button>
    </div>
  </div>
)

export default ReviewModalFooter
