const CancelOrderModal = ({
  isOpen,
  cancelReason,
  cancelNotes,
  defaultCancelReasons,
  onReasonChange,
  onNotesChange,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl">
        <h4 className="text-base font-semibold text-[#2f2f2f]">Cancel Order</h4>
        <p className="mt-1 text-sm text-[#6f665d]">
          Please provide a reason. A default reason is selected, and you can edit the note.
        </p>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Reason</span>
          <select
            value={cancelReason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="w-full rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          >
            {defaultCancelReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Notes</span>
          <textarea
            rows={3}
            value={cancelNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Add more context for cancellation"
            className="w-full rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          />
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#eadfce] bg-white px-4 py-1.5 text-sm font-semibold text-[#5f5f5f] transition hover:bg-[#f8f2e9]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#d64545] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#bf3f3f]"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelOrderModal
