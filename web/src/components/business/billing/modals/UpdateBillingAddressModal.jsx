import { useBillingAddressModal } from '../../../../hooks/useBillingAddressModal.hook'
import UpdateBillingAddressFormFields from './UpdateBillingAddressFormFields'

const UpdateBillingAddressModal = ({ isOpen, onClose, onSave, accountBillingDefaults }) => {
  const { register, errors, isSaving, handleClose, onValidSubmit } = useBillingAddressModal({
    isOpen,
    onClose,
    onSave,
    accountBillingDefaults
  })

  if (!isOpen) {
    return null
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-address-modal-title"
        className="w-full max-w-lg rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="billing-address-modal-title" className="text-lg font-semibold text-[#2f2f2f]">
          Update billing address
        </h2>
        <p className="mt-1.5 text-sm text-[#6d645d]">
          Enter the details that should appear on invoices and payment receipts.
        </p>

        <form onSubmit={onValidSubmit} noValidate>
          <UpdateBillingAddressFormFields register={register} errors={errors} />

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#f0e8de] pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl border border-[#e7dfd5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#9b5a2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#824b24] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateBillingAddressModal
