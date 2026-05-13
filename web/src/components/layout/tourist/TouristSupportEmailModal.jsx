import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { useAuthStore } from '../../../store/auth/auth.store'
import {
  postTouristSupportEmailVerificationConfirm,
  postTouristSupportEmailVerificationRequest,
  postTouristSupportEmailVerificationResend
} from '../../../services/tourist/tourist-account.service.js'
import { touristHomeHref } from './touristLayout.constants'

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

const TouristSupportEmailModal = ({ isOpen, onClose, afterVerified }) => {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const checkUser = useAuthStore((s) => s.checkUser)

  const [step, setStep] = useState('email')
  const [supportEmail, setSupportEmail] = useState('')
  const [code, setCode] = useState('')
  const [sessionToken, setSessionToken] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setStep('email')
    setSupportEmail('')
    setCode('')
    setSessionToken(null)
    setBusy(false)
    setError('')
    setMessage('')
  }, [isOpen])

  if (!isOpen) return null

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
      navigate(touristHomeHref, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not verify code.'))
    } finally {
      setBusy(false)
    }
  }

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
              </div>
              {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
              <button
                type="button"
                onClick={() => void onRequestCode()}
                disabled={busy || !supportEmail.trim()}
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
