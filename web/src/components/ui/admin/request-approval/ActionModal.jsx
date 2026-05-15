import { useAdminApprovalActionModal } from '../../../../hooks/useAdminApprovalActionModal.hook'
import ActionModalFormFields from './ActionModalFormFields'

const ActionModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmClassName,
  showNotes = true,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#ece3d9] bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-[#1f1f1f]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4f4f4f]">{description}</p>

        <form onSubmit={onValidSubmit} noValidate>
          {showNotes ? (
            <ActionModalFormFields register={register} errors={errors} disabled={isSubmitting} />
          ) : null}

          <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
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
