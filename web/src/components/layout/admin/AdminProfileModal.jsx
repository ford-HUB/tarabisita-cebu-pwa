import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import { useAuth } from '../../../hooks/useAuth.hook.js'
import { useAuthStore } from '../../../store/auth/auth.store.js'
import { getAdminProfile, patchAdminProfile } from '../../../services/admin/admin-account.service.js'
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock.hook.js'

const MASKED_PASSWORD = '••••••••'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

const inputClass =
  'mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#9b5a2c] focus:ring-2 focus:ring-[#9b5a2c]/25 disabled:cursor-not-allowed disabled:bg-[#f7f3ed] disabled:text-[#6d645d]'

const AdminProfileModal = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen)
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const baseline = useMemo(
    () => ({
      name: String(user?.name || '').trim()
    }),
    [user?.name]
  )

  const resetForm = useCallback(
    (profile) => {
      setName(profile?.name || user?.name || '')
      setEmail(profile?.email || user?.email || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowNewPassword(false)
      setFormError('')
    },
    [user?.email, user?.name]
  )

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    setIsEditing(false)
    setIsLoading(true)
    setFormError('')
    void getAdminProfile()
      .then((res) => {
        const profile = res?.data?.user
        resetForm(profile)
      })
      .catch(() => {
        resetForm(user)
      })
      .finally(() => {
        setIsLoading(false)
      })
    return undefined
  }, [isOpen, resetForm, user])

  const isDirty = useMemo(() => {
    const nameChanged = String(name).trim() !== baseline.name
    const passwordTouched = Boolean(newPassword || confirmPassword || currentPassword)
    return nameChanged || passwordTouched
  }, [name, baseline.name, newPassword, confirmPassword, currentPassword])

  const canSave = isEditing && isDirty && !isSaving

  const handleEdit = () => {
    setIsEditing(true)
    setFormError('')
  }

  const handleCancelEdit = () => {
    resetForm({ name: baseline.name, email })
    setIsEditing(false)
  }

  const handleSave = async () => {
    setFormError('')
    const trimmedName = String(name).trim()
    if (!trimmedName) {
      setFormError('Name is required.')
      return
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        setFormError('New password must be at least 8 characters.')
        return
      }
      if (newPassword !== confirmPassword) {
        setFormError('New password and confirm password do not match.')
        return
      }
      if (!currentPassword.trim()) {
        setFormError('Enter your current password to set a new password.')
        return
      }
    }

    setIsSaving(true)
    try {
      const body = { name: trimmedName }
      if (newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
        body.confirmPassword = confirmPassword
      }
      const res = await patchAdminProfile(body)
      const updated = res?.data?.user
      if (updated) {
        setUser({
          ...user,
          name: updated.name,
          email: updated.email ?? user?.email
        })
      }
      toast.success('Profile updated successfully')
      setIsEditing(false)
      resetForm(updated || { name: trimmedName, email })
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-modal-title"
        className="flex max-h-[min(92vh,calc(100dvh-0px))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-xl sm:max-h-[min(90vh,640px)] sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#f0e8de] px-4 py-3 sm:px-5">
          <h2 id="admin-profile-modal-title" className="text-base font-semibold text-[#1f1f1f]">
            Admin Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
            aria-label="Close profile"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {isLoading ? (
            <p className="text-sm text-[#6d645d]">Loading profile…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-profile-email" className="block text-xs font-medium text-[#6d645d]">
                  Email
                </label>
                <input
                  id="admin-profile-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="admin-profile-name" className="block text-xs font-medium text-[#6d645d]">
                  Name
                </label>
                <input
                  id="admin-profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  maxLength={120}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="admin-profile-password" className="block text-xs font-medium text-[#6d645d]">
                  Password
                </label>
                {!isEditing ? (
                  <div className="relative mt-1">
                    <input
                      id="admin-profile-password"
                      type="password"
                      readOnly
                      disabled
                      value={MASKED_PASSWORD}
                      className={inputClass}
                      aria-label="Password hidden"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a79a8b]">
                      <FiEyeOff className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 space-y-3">
                    <div className="relative">
                      <label htmlFor="admin-profile-current-password" className="sr-only">
                        Current password
                      </label>
                      <input
                        id="admin-profile-current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password (required to change)"
                        autoComplete="current-password"
                        className={inputClass}
                      />
                    </div>
                    <div className="relative">
                      <label htmlFor="admin-profile-new-password" className="sr-only">
                        New password
                      </label>
                      <input
                        id="admin-profile-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (optional)"
                        autoComplete="new-password"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6d645d] transition hover:bg-[#f7f3ed]"
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? (
                          <FiEyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <FiEye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </div>
                    <div>
                      <label htmlFor="admin-profile-confirm-password" className="sr-only">
                        Confirm new password
                      </label>
                      <input
                        id="admin-profile-confirm-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
                {!isEditing ? (
                  <p className="mt-1.5 text-[11px] text-[#8b8b8b]">
                    Password is never shown. Click Edit to change your password securely.
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="rounded-lg border border-[#fecdca] bg-[#fff4f2] px-3 py-2 text-sm text-[#b42318]" role="alert">
                  {formError}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[#f0e8de] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          {isEditing ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f7f3ed] disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#9b5a2c] transition hover:border-[#ff7a1a]/40 hover:bg-[#fff7ed] disabled:opacity-60"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave}
              className="inline-flex items-center justify-center rounded-full bg-[#9b5a2c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8a4f26] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

export default AdminProfileModal
