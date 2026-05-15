const ReviewModalFooter = ({
  activeStep,
  isApproved,
  onPrevious,
  onNext,
  onClose,
  onOpenDecline,
  onOpenApprove,
  onOpenRevoke
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
      {isApproved ? (
        <button
          type="button"
          onClick={onOpenRevoke}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
        >
          <span aria-hidden>⚠</span>
          Cancel approval
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpenDecline}
            className="rounded-full bg-[#dc2626] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#b91c1c]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onOpenApprove}
            className="rounded-full bg-[#15803d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#166534]"
          >
            Approve
          </button>
        </>
      )}
    </div>
  </div>
)

export default ReviewModalFooter
