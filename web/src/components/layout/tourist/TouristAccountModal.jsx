import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiCamera, FiX } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import {
  patchTouristProfile,
  postTouristUploadAvatar,
  postTouristChangePassword,
  postTouristEmailChangeConfirm,
  postTouristEmailChangeRequest,
  postTouristEmailChangeResend
} from '../../../services/tourist/tourist-account.service.js'
import { getAvatarFallback, touristHistoryHref } from './touristLayout.constants'

const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

const TouristAccountModal = ({ isOpen, onClose, initialView = 'menu', onLogout }) => {
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)
  const checkUser = useAuthStore((s) => s.checkUser)

  const [view, setView] = useState('menu')
  const [profileSaved, setProfileSaved] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [newEmailInput, setNewEmailInput] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailSessionToken, setEmailSessionToken] = useState(null)
  const [emailBusy, setEmailBusy] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const profileDefaults = useMemo(
    () => ({
      name: user?.name || ''
    }),
    [user?.name]
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: profileSubmitting }
  } = useForm({ defaultValues: profileDefaults })

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setView(initialView === 'settings' ? 'settings' : 'menu')
    setProfileSaved('')
    setProfileError('')
    setPasswordSaved('')
    setPasswordError('')
    setEmailMessage('')
    setEmailError('')
    setNewEmailInput('')
    setEmailCode('')
    setEmailSessionToken(null)
    setAvatarError('')
    reset(profileDefaults)
  }, [isOpen, initialView, profileDefaults, reset])

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read selected image'))
      reader.readAsDataURL(file)
    })

  const handleAvatarFile = async (event) => {
    const file = event.target.files?.[0]
    setAvatarError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setAvatarError('Image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setAvatarUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        setAvatarError('Invalid image.')
        return
      }
      const res = await postTouristUploadAvatar(dataUrl)
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
    } catch (err) {
      setAvatarError(getErrorMessage(err, 'Could not upload photo.'))
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarError('')
    setProfileError('')
    try {
      const res = await patchTouristProfile({ avatar: '' })
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
    } catch (err) {
      setAvatarError(getErrorMessage(err, 'Could not remove photo.'))
    }
  }

  if (!isOpen) {
    return null
  }

  const onProfileSave = async (data) => {
    setProfileError('')
    setProfileSaved('')
    try {
      const body = {}
      if (data.name != null && String(data.name).trim() !== String(user?.name || '').trim()) {
        body.name = String(data.name).trim()
      }
      if (!Object.keys(body).length) {
        setProfileSaved('No changes to save.')
        return
      }
      const res = await patchTouristProfile(body)
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
      setProfileSaved('Profile saved.')
      reset({
        name: next?.name ?? body.name ?? user?.name
      })
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Could not update profile.'))
    }
  }

  const onPasswordSave = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSaved('')
    setPasswordSubmitting(true)
    try {
      await postTouristChangePassword({
        currentPassword: pwCurrent,
        newPassword: pwNew,
        confirmPassword: pwConfirm
      })
      setPasswordSaved('Password updated.')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Could not change password.'))
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const onEmailRequest = async () => {
    setEmailError('')
    setEmailMessage('')
    setEmailBusy(true)
    try {
      const res = await postTouristEmailChangeRequest({ newEmail: newEmailInput.trim() })
      const token = res?.data?.properties?.sessionToken
      if (token) {
        setEmailSessionToken(token)
      }
      setEmailMessage('We sent a 6-digit code to your new email. Enter it below to confirm.')
    } catch (err) {
      setEmailError(getErrorMessage(err, 'Could not send verification email.'))
    } finally {
      setEmailBusy(false)
    }
  }

  const onEmailResend = async () => {
    if (!emailSessionToken) return
    setEmailError('')
    setEmailMessage('')
    setEmailBusy(true)
    try {
      await postTouristEmailChangeResend({ sessionToken: emailSessionToken })
      setEmailMessage('A new code was sent to your new email.')
    } catch (err) {
      setEmailError(getErrorMessage(err, 'Could not resend code.'))
    } finally {
      setEmailBusy(false)
    }
  }

  const onEmailConfirm = async () => {
    if (!emailSessionToken) return
    setEmailError('')
    setEmailMessage('')
    setEmailBusy(true)
    try {
      const res = await postTouristEmailChangeConfirm({
        sessionToken: emailSessionToken,
        code: emailCode.trim()
      })
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
      setEmailMessage('Email updated successfully.')
      setEmailSessionToken(null)
      setEmailCode('')
      setNewEmailInput('')
    } catch (err) {
      setEmailError(getErrorMessage(err, 'Could not verify email.'))
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourist-account-modal-title"
        className="flex max-h-[min(92vh,calc(100dvh-0px))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-xl sm:max-h-[min(90vh,720px)] sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#f0e8de] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {view === 'settings' ? (
              <button
                type="button"
                onClick={() => setView('menu')}
                className="shrink-0 rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
                aria-label="Back to account menu"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <h2 id="tourist-account-modal-title" className="truncate text-base font-semibold text-[#1f1f1f]">
              {view === 'settings' ? 'Account settings' : 'Your account'}
            </h2>
          </div>
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
          {view === 'menu' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-[#ece3d9] bg-[#fbf9f6] p-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full border border-[#e7dfd5] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ff7a1a] text-sm font-semibold text-white">
                    {getAvatarFallback(user?.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1f1f1f]">{user?.name || 'Tourist'}</p>
                  <p className="mt-1 truncate text-sm text-[#6d645d]">{user?.email || '—'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView('settings')}
                className="w-full rounded-xl border border-[#e7dfd5] bg-white px-4 py-3 text-left text-sm font-medium text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed]"
              >
                Account settings
              </button>
              <Link
                to={touristHistoryHref}
                onClick={() => onClose?.()}
                className="block w-full rounded-xl border border-[#e7dfd5] bg-white px-4 py-3 text-left text-sm font-medium text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed]"
              >
                Order history
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose?.()
                  void onLogout?.()
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-[#b42318] transition hover:bg-[#fee4e2]"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#2f2f2f]">Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-16 w-16 rounded-full border border-[#e7dfd5] object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e8da] text-lg font-semibold text-[#9b5a2c]">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                    <label
                      className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e7dfd5] bg-white text-[#7d7164] shadow-sm transition hover:bg-[#f5eee4]"
                      title="Upload profile picture"
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatarFile(e)} />
                      <FiCamera size={15} aria-hidden />
                    </label>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-xs text-[#6d645d]">JPG, PNG, or WebP · up to 5 MB</p>
                    {user?.avatar ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveAvatar()}
                        className="text-xs font-medium text-[#b42318] underline-offset-2 hover:underline"
                      >
                        Remove photo
                      </button>
                    ) : null}
                    {avatarUploading ? <p className="text-xs text-[#7d7164]">Uploading…</p> : null}
                    {avatarError ? <p className="text-xs text-[#b42318]">{avatarError}</p> : null}
                  </div>
                </div>
                <form className="space-y-3" onSubmit={handleSubmit(onProfileSave)} noValidate>
                  <div>
                    <label htmlFor="tourist-profile-name" className="block text-xs font-medium text-[#6d645d]">
                      Display name
                    </label>
                    <input
                      id="tourist-profile-name"
                      type="text"
                      autoComplete="name"
                      className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                      {...register('name')}
                    />
                  </div>
                  {profileError ? <p className="text-sm text-[#b42318]">{profileError}</p> : null}
                  {profileSaved ? <p className="text-sm text-[#027a48]">{profileSaved}</p> : null}
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
                  >
                    {profileSubmitting ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#2f2f2f]">Change password</h3>
                <form className="space-y-3" onSubmit={onPasswordSave} noValidate>
                  <div>
                    <label htmlFor="tourist-pw-current" className="block text-xs font-medium text-[#6d645d]">
                      Current password
                    </label>
                    <input
                      id="tourist-pw-current"
                      type="password"
                      autoComplete="current-password"
                      className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                      value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="tourist-pw-new" className="block text-xs font-medium text-[#6d645d]">
                      New password
                    </label>
                    <input
                      id="tourist-pw-new"
                      type="password"
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="tourist-pw-confirm" className="block text-xs font-medium text-[#6d645d]">
                      Confirm new password
                    </label>
                    <input
                      id="tourist-pw-confirm"
                      type="password"
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                    />
                  </div>
                  {passwordError ? <p className="text-sm text-[#b42318]">{passwordError}</p> : null}
                  {passwordSaved ? <p className="text-sm text-[#027a48]">{passwordSaved}</p> : null}
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed] disabled:opacity-60"
                  >
                    {passwordSubmitting ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#2f2f2f]">Change email</h3>
                <p className="text-xs text-[#6d645d]">
                  We&apos;ll send a verification code to the new address. Your sign-in email updates only after you confirm
                  the code.
                </p>
                <div>
                  <label htmlFor="tourist-email-new" className="block text-xs font-medium text-[#6d645d]">
                    New email
                  </label>
                  <input
                    id="tourist-email-new"
                    type="email"
                    autoComplete="email"
                    className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    disabled={Boolean(emailSessionToken)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onEmailRequest()}
                    disabled={emailBusy || !newEmailInput.trim() || Boolean(emailSessionToken)}
                    className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
                  >
                    Send code
                  </button>
                  {emailSessionToken ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void onEmailResend()}
                        disabled={emailBusy}
                        className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed] disabled:opacity-60"
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailSessionToken(null)
                          setEmailCode('')
                          setEmailError('')
                          setEmailMessage('')
                        }}
                        className="text-xs font-medium text-[#9b5a2c] underline-offset-2 hover:underline"
                      >
                        Use a different email
                      </button>
                    </>
                  ) : null}
                </div>
                {emailSessionToken ? (
                  <div>
                    <label htmlFor="tourist-email-code" className="block text-xs font-medium text-[#6d645d]">
                      Verification code
                    </label>
                    <input
                      id="tourist-email-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void onEmailConfirm()}
                      disabled={emailBusy || !emailCode.trim()}
                      className="mt-3 rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed] disabled:opacity-60"
                    >
                      Verify and update email
                    </button>
                  </div>
                ) : null}
                {emailError ? <p className="text-sm text-[#b42318]">{emailError}</p> : null}
                {emailMessage ? <p className="text-sm text-[#027a48]">{emailMessage}</p> : null}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TouristAccountModal
