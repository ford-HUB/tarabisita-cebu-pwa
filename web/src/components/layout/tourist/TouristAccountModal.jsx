import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  FiArrowLeft,
  FiCamera,
  FiChevronDown,
  FiChevronRight,
  FiInfo,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiUser
} from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import {
  patchTouristProfile,
  patchTouristSupportEmailClear,
  postTouristUploadAvatar,
  postTouristEmailChangeConfirm,
  postTouristEmailChangeRequest,
  postTouristEmailChangeResend
} from '../../../services/tourist/tourist-account.service.js'
import { getAvatarFallback, touristHistoryHref } from './touristLayout.constants'
import TouristChangePasswordModal from './TouristChangePasswordModal.jsx'
import TouristSupportEmailModal from './TouristSupportEmailModal.jsx'

const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

/** Compact pills aligned with “Send code” (same padding / inline-flex). */
const securityPrimaryPillClass =
  'inline-flex items-center justify-center rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60'

const securityOutlinePillClass =
  'inline-flex items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed] disabled:opacity-60'

/** Menu list rows: icon + label (reference dropdown pattern). */
const accountMenuRowClass =
  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5f3f0] active:bg-[#ebe6df] sm:px-3.5 sm:py-3'

const accountMenuIconClass = 'h-[1.125rem] w-[1.125rem] shrink-0 text-[#5c534c] sm:h-5 sm:w-5'

const TouristAccountModal = ({ isOpen, onClose, initialView = 'menu', onLogout }) => {
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)
  const checkUser = useAuthStore((s) => s.checkUser)

  const [view, setView] = useState('menu')
  const [profileSaved, setProfileSaved] = useState('')
  const [profileError, setProfileError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [newEmailInput, setNewEmailInput] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailSessionToken, setEmailSessionToken] = useState(null)
  const [emailBusy, setEmailBusy] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [supportEmailFlowOpen, setSupportEmailFlowOpen] = useState(false)
  const [supportRemoveSubmitting, setSupportRemoveSubmitting] = useState(false)
  const [supportRemoveError, setSupportRemoveError] = useState('')
  const [supportRemoveMessage, setSupportRemoveMessage] = useState('')
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [profileEditMode, setProfileEditMode] = useState(false)
  const panelRef = useRef(null)

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
    formState: { isSubmitting: profileSubmitting, isDirty: profileFormDirty }
  } = useForm({ defaultValues: profileDefaults })

  const [securitySettingsExpanded, setSecuritySettingsExpanded] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSupportEmailFlowOpen(false)
      setChangePasswordModalOpen(false)
      return
    }
    setView(initialView === 'settings' ? 'settings' : 'menu')
    setProfileSaved('')
    setProfileError('')
    setEmailMessage('')
    setEmailError('')
    setNewEmailInput('')
    setEmailCode('')
    setEmailSessionToken(null)
    setAvatarError('')
    setSupportEmailFlowOpen(false)
    setSupportRemoveError('')
    setSupportRemoveMessage('')
    setSupportRemoveSubmitting(false)
    reset(profileDefaults)
    setSecuritySettingsExpanded(false)
    setProfileEditMode(false)
  }, [isOpen, initialView, profileDefaults, reset])

  useEffect(() => {
    if (view === 'settings') {
      setSecuritySettingsExpanded(false)
    }
  }, [view])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    const onPointerDown = (e) => {
      if (changePasswordModalOpen || supportEmailFlowOpen) return
      const panel = panelRef.current
      if (panel && !panel.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen, changePasswordModalOpen, supportEmailFlowOpen, onClose])

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read selected image'))
      reader.readAsDataURL(file)
    })

  const handleAvatarFile = async (event) => {
    if (!profileEditMode) {
      event.target.value = ''
      return
    }
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
    if (!profileEditMode) return
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
    if (!profileEditMode) return
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
      setProfileEditMode(false)
      reset({
        name: next?.name ?? body.name ?? user?.name
      })
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Could not update profile.'))
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

  const onRemoveSupportEmail = async () => {
    setSupportRemoveError('')
    setSupportRemoveMessage('')
    if (!user?.supportEmail) return
    setSupportRemoveSubmitting(true)
    try {
      const res = await patchTouristSupportEmailClear()
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
      setSupportRemoveMessage('Support email removed.')
    } catch (err) {
      setSupportRemoveError(getErrorMessage(err, 'Could not remove support email.'))
    } finally {
      setSupportRemoveSubmitting(false)
    }
  }

  return (
    <>
      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-[35] bg-black/20 sm:bg-black/25"
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tourist-account-modal-title"
            className="absolute right-0 top-full z-[45] mt-2 flex w-[min(20rem,calc(100vw-1rem))] max-h-[min(85dvh,calc(100dvh-4rem))] flex-col overflow-hidden rounded-2xl bg-white"
          >
        {view === 'menu' ? (
          <h2 id="tourist-account-modal-title" className="sr-only">
            Your account
          </h2>
        ) : (
          <header className="shrink-0 border-b border-[#f0e8de] px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setView('menu')
                  setProfileEditMode(false)
                }}
                className="shrink-0 rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed] active:bg-[#efe7dc]"
                aria-label="Back to account menu"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <h2
                id="tourist-account-modal-title"
                className="min-w-0 flex-1 truncate text-[17px] font-semibold leading-snug tracking-tight text-[#1f1f1f]"
              >
                Account settings
              </h2>
            </div>
          </header>
        )}

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 ${
            view === 'menu' ? 'pb-5 pt-3 sm:pb-6 sm:pt-4' : 'py-5 sm:px-6 sm:py-6'
          }`}
        >
          {view === 'menu' ? (
            <div className="flex max-w-md flex-col">
              <div className="pb-4">
                <p className="text-[15px] font-semibold leading-snug tracking-tight text-[#1f1f1f]">
                  {user?.name || 'Tourist'}
                </p>
                <p className="mt-1 truncate text-sm leading-relaxed text-[#6d645d]">{user?.email || '—'}</p>
                <span className="mt-2 block text-xs leading-relaxed text-[#8a8279]">
                  Manage your profile, security, orders, and sign-in options.
                </span>
              </div>

              <nav className="flex flex-col gap-0.5" aria-label="Account menu">
                <button
                  type="button"
                  onClick={() => {
                    setView('settings')
                    setProfileEditMode(true)
                  }}
                  className={accountMenuRowClass}
                >
                  <FiUser className={accountMenuIconClass} strokeWidth={2} aria-hidden />
                  <span>Edit profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('settings')
                    setProfileEditMode(false)
                  }}
                  className={accountMenuRowClass}
                >
                  <FiSettings className={accountMenuIconClass} strokeWidth={2} aria-hidden />
                  <span>Account settings</span>
                </button>
                <Link
                  to={touristHistoryHref}
                  onClick={() => onClose?.()}
                  className={accountMenuRowClass}
                >
                  <FiPackage className={accountMenuIconClass} strokeWidth={2} aria-hidden />
                  <span>Order history</span>
                </Link>
              </nav>

              <div className="mt-4 border-t border-[#ece8e0] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose?.()
                    void onLogout?.()
                  }}
                  className={`${accountMenuRowClass} font-semibold text-[#b42318] hover:bg-[#fff5f5] active:bg-[#feecec]`}
                >
                  <FiLogOut className={`${accountMenuIconClass} text-[#b42318]`} strokeWidth={2} aria-hidden />
                  <span>Sign out</span>
                </button>
              </div>
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
                    {profileEditMode ? (
                      <label
                        className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e7dfd5] bg-white text-[#7d7164] shadow-sm transition hover:bg-[#f5eee4]"
                        title="Upload profile picture"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void handleAvatarFile(e)}
                          disabled={avatarUploading}
                        />
                        <FiCamera size={15} aria-hidden />
                      </label>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {profileEditMode ? (
                      <p className="text-xs text-[#6d645d]">JPG, PNG, or WebP · up to 5 MB</p>
                    ) : null}
                    {profileEditMode && user?.avatar ? (
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
                      disabled={!profileEditMode}
                      className={`mt-1 w-full rounded-lg border border-[#e7dfd5] px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2 ${
                        profileEditMode
                          ? 'bg-white text-[#1f1f1f]'
                          : 'cursor-not-allowed bg-[#f2ede6] text-[#5b534c]'
                      }`}
                      {...register('name')}
                    />
                  </div>
                  {profileError ? <p className="text-sm text-[#b42318]">{profileError}</p> : null}
                  {profileSaved ? <p className="text-sm text-[#027a48]">{profileSaved}</p> : null}
                  {!profileEditMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        reset(profileDefaults)
                        setProfileEditMode(true)
                      }}
                      className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12]"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          reset(profileDefaults)
                          setProfileEditMode(false)
                          setProfileError('')
                          setProfileSaved('')
                          setAvatarError('')
                        }}
                        className={securityOutlinePillClass}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileSubmitting || !profileFormDirty}
                        className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
                      >
                        {profileSubmitting ? 'Saving…' : 'Save profile'}
                      </button>
                    </div>
                  )}
                </form>
              </section>

              <section
                className="rounded-xl border border-[#ece3d9] bg-[#fbf9f6] p-4 shadow-sm sm:p-5"
                aria-labelledby="tourist-account-security-heading"
              >
                <button
                  type="button"
                  onClick={() => setSecuritySettingsExpanded((open) => !open)}
                  className="flex w-full items-start justify-between gap-3 rounded-lg text-left outline-none ring-[#9b5a2c]/30 transition hover:bg-[#f5efe6] focus-visible:ring-2 sm:-mx-1 sm:px-1 sm:py-0.5"
                  aria-expanded={securitySettingsExpanded}
                  aria-controls="tourist-account-security-panel"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      id="tourist-account-security-heading"
                      className="block text-sm font-semibold tracking-tight text-[#1f1f1f]"
                    >
                      Security settings
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-[#6d645d]">
                      Change your sign-in email or password, then manage support email if you use one.
                    </span>
                  </span>
                  <FiChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-[#8a7568] transition-transform duration-200 ${
                      securitySettingsExpanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                {securitySettingsExpanded ? (
                <div
                  id="tourist-account-security-panel"
                  role="region"
                  aria-labelledby="tourist-account-security-heading"
                  className="mt-4 space-y-6 border-t border-[#e8dfd4] pt-4"
                >
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a7568]">
                      Change email
                    </h4>
                    <p className="text-xs text-[#6d645d]">
                      We&apos;ll send a verification code to the new address. Your sign-in email updates only after you
                      confirm the code.
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
                        className={securityPrimaryPillClass}
                      >
                        Send code
                      </button>
                      {emailSessionToken ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void onEmailResend()}
                            disabled={emailBusy}
                            className={securityOutlinePillClass}
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
                          className={`${securityOutlinePillClass} mt-3`}
                        >
                          Verify and update email
                        </button>
                      </div>
                    ) : null}
                    {emailError ? <p className="text-sm text-[#b42318]">{emailError}</p> : null}
                    {emailMessage ? <p className="text-sm text-[#027a48]">{emailMessage}</p> : null}
                  </div>

                  <div className="space-y-3 border-t border-[#e8dfd4] pt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a7568]">
                      Change password
                    </h4>
                    <p className="text-xs leading-relaxed text-[#6d645d]">
                      Update the password you use to sign in to TARA.
                    </p>
                    <button
                      type="button"
                      onClick={() => setChangePasswordModalOpen(true)}
                      className={securityPrimaryPillClass}
                    >
                      Update password
                    </button>
                  </div>

                  <div className="space-y-3 border-t border-[#e8dfd4] pt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a7568]">
                      Support email
                    </h4>
                    <p className="text-xs text-[#6d645d]">
                      Use a separate verified address to sign in with the same password. You can have one support email per
                      account.
                    </p>
                    {user?.supportEmail ? (
                      <p className="text-xs text-[#5a534c]">
                        Current: <span className="font-medium">{user.supportEmail}</span>
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSupportEmailFlowOpen(true)}
                      className={securityPrimaryPillClass}
                    >
                      {user?.supportEmail ? 'Change support email' : 'Add support email'}
                    </button>
                    {user?.supportEmail ? (
                      <div className="space-y-2 border-t border-[#f0e8de] pt-3">
                        {supportRemoveError ? <p className="text-sm text-[#b42318]">{supportRemoveError}</p> : null}
                        {supportRemoveMessage ? <p className="text-sm text-[#027a48]">{supportRemoveMessage}</p> : null}
                        <button
                          type="button"
                          disabled={supportRemoveSubmitting}
                          onClick={() => void onRemoveSupportEmail()}
                          className={securityOutlinePillClass}
                        >
                          {supportRemoveSubmitting ? 'Removing…' : 'Remove support email'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
          </div>
        </>
      ) : null}

      <TouristChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      <TouristSupportEmailModal
        isOpen={supportEmailFlowOpen}
        onClose={() => setSupportEmailFlowOpen(false)}
        afterVerified={() => onClose?.()}
      />
    </>
  )
}

export default TouristAccountModal
