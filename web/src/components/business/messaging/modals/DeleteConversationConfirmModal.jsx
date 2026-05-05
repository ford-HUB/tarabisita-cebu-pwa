const DeleteConversationConfirmModal = ({ isOpen, isDeleting, onCancel, onConfirm }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#1f1f1f]">Delete conversation?</h3>
        <p className="mt-2 text-sm text-[#5b5b5b]">
          This will permanently remove the entire message thread with this customer.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-[#b42318] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#912018] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete conversation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConversationConfirmModal
