import { useAdminApprovalActionModal } from '../../../../hooks/useAdminApprovalActionModal.hook'
import ActionModalFormFields from './ActionModalFormFields'

const ActionModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onClose,
  onConfirm,
  isSubmitting
}) => {
  const { register, errors, handleClose, onValidSubmit } = useAdminApprovalActionModal({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#ece3d9] bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-[#1f1f1f]">{title}</h3>
        <p className="mt-2 text-sm text-[#4f4f4f]">{description}</p>

        <form onSubmit={onValidSubmit} noValidate>
          <ActionModalFormFields register={register} errors={errors} disabled={isSubmitting} />

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActionModal
