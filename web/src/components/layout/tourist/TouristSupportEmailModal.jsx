import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import {
  postTouristSupportEmailVerificationConfirm,
  postTouristSupportEmailVerificationRequest,
  postTouristSupportEmailVerificationResend
} from '../../../services/tourist/tourist-account.service.js'
import { touristHomeHref } from './touristLayout.constants'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

/** Same shape check as register (avoid spamming mail-checker while typing). */
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const EMAIL_CHECK_DEBOUNCE_MS = 450

const verifiedTakenForSupport = (accountRole) => {
  if (accountRole === 'BUSINESS') {
    return 'This address is already used on a business account. Sign in with it or choose a different email.'
  }
  if (accountRole === 'TOURIST') {
    return 'This address is already used on a tourist account. Sign in with it or choose a different email.'
  }
  return 'This address is already linked to an account. Sign in with it or choose a different email.'
}

const TouristSupportEmailModal = ({ isOpen, onClose, afterVerified, redirectAfterVerify = true }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)
  const checkUser = useAuthStore((s) => s.checkUser)
  const mailChecker = useAuthStore((s) => s.mailChecker)

  const [step, setStep] = useState('email')
  const [supportEmail, setSupportEmail] = useState('')
  const [code, setCode] = useState('')
  const [sessionToken, setSessionToken] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [emailStatus, setEmailStatus] = useState({
    state: 'idle',
    exists: false,
    isEmailVerified: false,
    accountRole: null,
    message: ''
  })
  const latestEmailCheckIdRef = useRef(0)

  const primaryNorm = String(user?.email || '').trim().toLowerCase()
  const currentSupportNorm = String(user?.supportEmail || '').trim().toLowerCase()

  const handleEmailCheck = useCallback(
    async (rawEmail) => {
      const nextEmail = String(rawEmail || '').trim().toLowerCase()
      if (!nextEmail) {
        setEmailStatus({
          state: 'idle',
          exists: false,
          isEmailVerified: false,
          accountRole: null,
          message: ''
        })
        return
      }

      if (nextEmail === primaryNorm) {
        setEmailStatus({
          state: 'blocked',
          exists: false,
          isEmailVerified: false,
          accountRole: null,
          message: 'Support email must be different from your sign-in email.'
        })
        return
      }

      if (currentSupportNorm && nextEmail === currentSupportNorm) {
        setEmailStatus({
          state: 'blocked',
          exists: false,
          isEmailVerified: false,
          accountRole: null,
          message: 'That is already your support email.'
        })
        return
      }

      const checkId = latestEmailCheckIdRef.current + 1
      latestEmailCheckIdRef.current = checkId
      setEmailStatus((previous) => ({
        ...previous,
        state: 'checking',
        message: '',
        exists: false,
        isEmailVerified: false,
        accountRole: null
      }))

      try {
        const response = await mailChecker({ email: nextEmail })
        if (latestEmailCheckIdRef.current !== checkId) return

        const properties = response?.data?.properties || {}
        const exists = Boolean(properties.exists)
        const isEmailVerified = Boolean(properties.isEmailVerified)
        const accountRole = properties.accountRole ? String(properties.accountRole) : null

        if (exists) {
          setEmailStatus({
            state: 'ok',
            exists: true,
            isEmailVerified,
            accountRole,
            message: isEmailVerified
              ? verifiedTakenForSupport(accountRole)
              : 'This address is already on another account (not verified yet). Choose a different email.'
          })
          return
        }

        setEmailStatus({
          state: 'ok',
          exists: false,
          isEmailVerified: false,
          accountRole: null,
          message: 'This address is available to use as your support email.'
        })
      } catch (err) {
        if (latestEmailCheckIdRef.current !== checkId) return

        const status = err?.response?.status
        if (status === 404) {
          setEmailStatus({
            state: 'not_found',
            exists: false,
            isEmailVerified: false,
            accountRole: null,
            message: 'This address is available to use as your support email.'
          })
          return
        }

        setEmailStatus({
          state: 'error',
          exists: false,
          isEmailVerified: false,
          accountRole: null,
          message: 'Unable to check email right now. Please try again.'
        })
      }
    },
    [mailChecker, primaryNorm, currentSupportNorm]
  )

  useEffect(() => {
    if (!isOpen) return
    setStep('email')
    setSupportEmail('')
    setCode('')
    setSessionToken(null)
    setBusy(false)
    setError('')
    setMessage('')
    setEmailStatus({
      state: 'idle',
      exists: false,
      isEmailVerified: false,
      accountRole: null,
      message: ''
    })
    latestEmailCheckIdRef.current += 1
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || step !== 'email') return undefined

    const trimmed = String(supportEmail || '').trim()
    if (!trimmed) {
      setEmailStatus({
        state: 'idle',
        exists: false,
        isEmailVerified: false,
        accountRole: null,
        message: ''
      })
      return undefined
    }

    if (!looksLikeEmail(trimmed)) {
      setEmailStatus((previous) => ({
        ...previous,
        state: 'idle',
        exists: false,
        isEmailVerified: false,
        accountRole: null,
        message: ''
      }))
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      void handleEmailCheck(trimmed)
    }, EMAIL_CHECK_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen, step, supportEmail, handleEmailCheck])

  const supportEmailLooksComplete = looksLikeEmail(String(supportEmail || '').trim())
  const isEmailCheckPending = step === 'email' && supportEmailLooksComplete && emailStatus.state === 'checking'
  const isSupportEmailBlocked =
    emailStatus.state === 'blocked' || (emailStatus.state === 'ok' && emailStatus.exists)
  const hasDefinitiveAvailableCheck =
    (emailStatus.state === 'ok' && !emailStatus.exists) || emailStatus.state === 'not_found'
  const canContinueEmailStep =
    supportEmailLooksComplete &&
    !isEmailCheckPending &&
    !isSupportEmailBlocked &&
    emailStatus.state !== 'error' &&
    hasDefinitiveAvailableCheck

  const onRequestCode = async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const res = await postTouristSupportEmailVerificationRequest({ supportEmail: supportEmail.trim() })
      const token = res?.data?.properties?.sessionToken
      if (token) setSessionToken(token)
      setStep('code')
      setMessage('We sent a 6-digit code to that address. Enter it below to finish.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send verification code.'))
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    if (!sessionToken) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await postTouristSupportEmailVerificationResend({ sessionToken })
      setMessage('A new code was sent.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend code.'))
    } finally {
      setBusy(false)
    }
  }

  const onConfirm = async () => {
    if (!sessionToken) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const res = await postTouristSupportEmailVerificationConfirm({
        sessionToken,
        code: code.trim()
      })
      const next = res?.data?.user
      if (next) {
        setUser(next)
      } else {
        await checkUser({ silent: true })
      }
      afterVerified?.()
      onClose?.()
      if (redirectAfterVerify) {
        navigate(touristHomeHref, { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not verify code.'))
    } finally {
      setBusy(false)
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
        aria-labelledby="tourist-support-email-modal-title"
        className="flex max-h-[min(92vh,calc(100dvh-0px))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-xl sm:max-h-[min(90vh,640px)] sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#f0e8de] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {step === 'code' ? (
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setSessionToken(null)
                  setCode('')
                  setError('')
                  setMessage('')
                }}
                className="shrink-0 rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
                aria-label="Back"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <h2 id="tourist-support-email-modal-title" className="truncate text-base font-semibold text-[#1f1f1f]">
              Support email
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
          {step === 'email' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#6d645d]">
                Add one verified address you can use to sign in with the same password. We will email a code to prove you
                own the address. Each account may only have one support email.
              </p>
              <div>
                <label htmlFor="support-email-modal-input" className="block text-xs font-medium text-[#6d645d]">
                  Support email address
                </label>
                <input
                  id="support-email-modal-input"
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  disabled={busy}
                />
                {(emailStatus.state === 'checking' || emailStatus.message) && (
                  <span
                    role="status"
                    aria-live="polite"
                    className={`mt-1 block text-xs ${
                      emailStatus.state === 'error' ||
                      emailStatus.state === 'blocked' ||
                      (emailStatus.state === 'ok' && emailStatus.exists && emailStatus.isEmailVerified)
                        ? 'text-[#b42318]'
                        : emailStatus.state === 'ok' && emailStatus.exists && !emailStatus.isEmailVerified
                          ? 'text-[#6d645d]'
                          : emailStatus.state === 'checking'
                            ? 'text-[#6d645d]'
                            : 'text-[#027a48]'
                    }`}
                  >
                    {emailStatus.state === 'checking' ? 'Checking email...' : emailStatus.message}
                  </span>
                )}
              </div>
              {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
              <button
                type="button"
                onClick={() => void onRequestCode()}
                disabled={busy || !canContinueEmailStep}
                className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Continue'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#6d645d]">
                Enter the 6-digit code we sent to <span className="font-medium text-[#2f2f2f]">{supportEmail.trim()}</span>.
              </p>
              <div>
                <label htmlFor="support-email-modal-code" className="block text-xs font-medium text-[#6d645d]">
                  Verification code
                </label>
                <input
                  id="support-email-modal-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm outline-none ring-[#9b5a2c]/25 focus:ring-2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onConfirm()}
                  disabled={busy || !code.trim()}
                  className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:opacity-60"
                >
                  {busy ? 'Verifying…' : 'Verify and save'}
                </button>
                <button
                  type="button"
                  onClick={() => void onResend()}
                  disabled={busy}
                  className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f3ed] disabled:opacity-60"
                >
                  Resend code
                </button>
              </div>
              {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
              {message ? <p className="text-sm text-[#027a48]">{message}</p> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TouristSupportEmailModal
