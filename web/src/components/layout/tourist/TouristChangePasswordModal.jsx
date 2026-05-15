import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { postTouristChangePassword } from '../../../services/tourist/tourist-account.service.js'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

const TouristChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setPwCurrent('')
    setPwNew('')
    setPwConfirm('')
    setPasswordError('')
  }, [isOpen])

  const onSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSubmitting(true)
    try {
      await postTouristChangePassword({
        currentPassword: pwCurrent,
        newPassword: pwNew,
        confirmPassword: pwConfirm
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Could not change password.'))
    } finally {
      setPasswordSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourist-change-password-modal-title"
        className="flex max-h-[min(92vh,calc(100dvh-0px))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-xl sm:max-h-[min(90vh,560px)] sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#f0e8de] px-4 py-3 sm:px-5">
          <h2 id="tourist-change-password-modal-title" className="truncate text-base font-semibold text-[#1f1f1f]">
            Change password
          </h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="shrink-0 rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-xs leading-relaxed text-[#6d645d]">
            Enter your current password, then choose a new one. You will stay signed in on this device.
          </p>
          <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="tourist-change-pw-current" className="block text-xs font-medium text-[#6d645d]">
                Current password
              </label>
              <input
                id="tourist-change-pw-current"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tourist-change-pw-new" className="block text-xs font-medium text-[#6d645d]">
                New password
              </label>
              <input
                id="tourist-change-pw-new"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tourist-change-pw-confirm" className="block text-xs font-medium text-[#6d645d]">
                Confirm new password
              </label>
              <input
                id="tourist-change-pw-confirm"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-[#b42318]" role="status">
                {passwordError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
              >
                {passwordSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TouristChangePasswordModal
