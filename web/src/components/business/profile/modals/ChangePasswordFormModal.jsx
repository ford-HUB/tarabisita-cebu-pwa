import { useChangePasswordFormModal } from '../../../../hooks/useChangePasswordFormModal.hook'
import ChangePasswordFormFields from './ChangePasswordFormFields'

const ChangePasswordFormModal = ({ isOpen, isChangingPassword, onClose, onSubmitPassword }) => {
  const { register, errors, handleClose, onValidSubmit } = useChangePasswordFormModal({
    isOpen,
    onClose,
    onSubmitPassword,
    isChangingPassword
  })

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h4 className="text-lg font-semibold text-[#1f1f1f]">Update Password</h4>
        <p className="mt-2 text-sm text-[#5b5b5b]">Enter your current password before setting a new password.</p>

        <form onSubmit={onValidSubmit} noValidate>
          <ChangePasswordFormFields register={register} errors={errors} disabled={isChangingPassword} />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isChangingPassword}
              className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordFormModal
