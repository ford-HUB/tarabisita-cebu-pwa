const requirements = [
  'Business permit (clear photo or scanned copy)',
  'Valid owner or representative ID',
  'Storefront or office image for verification',
  'Contact number and operating hours confirmation'
]

const BusinessVerificationModal = ({ isOpen, onClose, onSubmitProof }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#9b5a2c]">Account Notice</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">Business verification required</h2>
        <p className="mt-2 text-sm text-[#4f4f4f]">
          Please provide your proof of business for verification to unlock all account operations.
        </p>

        <div className="mt-4 rounded-xl bg-[#f9f4ee] p-4">
          <p className="text-sm font-medium text-[#1f1f1f]">Required documents:</p>
          <ul className="mt-2 space-y-1 text-sm text-[#4f4f4f]">
            {requirements.map((requirement) => (
              <li key={requirement}>- {requirement}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
          >
            Later
          </button>
          <button
            type="button"
            onClick={onSubmitProof}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
          >
            Submit Proof
          </button>
        </div>
      </div>
    </div>
  )
}

export default BusinessVerificationModal
