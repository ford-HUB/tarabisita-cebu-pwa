const ChangePasswordConfirmModal = ({ isOpen, onClose, onProceed }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h4 className="text-lg font-semibold text-[#1f1f1f]">Change Password</h4>
        <p className="mt-2 text-sm text-[#5b5b5b]">Are you sure you want to change your password?</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
          >
            No
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordConfirmModal
