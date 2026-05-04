import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VerificationCodeInput from '../../components/auth/VerificationCodeInput'
import VerificationCountdown from '../../components/auth/VerificationCountdown'
import { useAuthStore } from '../../store/auth/auth.store'
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast.util'
import { verificationCodeSchema } from '../../shared/validators/auth.validator'

const COUNTDOWN_SECONDS = 300

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const resendVerificationCode = useAuthStore((state) => state.resendVerficiationCode)
  const verifyCode = useAuthStore((state) => state.verifyCode)
  const setVerificationExpiry = useAuthStore((state) => state.setVerificationExpiry)
  const getVerificationExpiry = useAuthStore((state) => state.getVerificationExpiry)
  const [countdownKey, setCountdownKey] = useState(0)
  const [isCodeExpired, setIsCodeExpired] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [activeSessionToken, setActiveSessionToken] = useState(searchParams.get('token') || '')

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      code: '',
    },
    resolver: zodResolver(verificationCodeSchema),
    mode: 'onBlur',
  })

  const code = watch('code')
  const hasSessionToken = Boolean(activeSessionToken)
  const activeExpiresAt = getVerificationExpiry(activeSessionToken)

  const countdownSeconds = useMemo(() => {
    if (!activeExpiresAt) {
      return COUNTDOWN_SECONDS
    }

    const remainingMilliseconds = new Date(activeExpiresAt).getTime() - Date.now()
    return Math.max(Math.ceil(remainingMilliseconds / 1000), 0)
  }, [activeExpiresAt])

  useEffect(() => {
    if (!hasSessionToken) {
      showErrorToast('Verification session not found. Please register again.')
      navigate('/register')
    }
  }, [hasSessionToken, navigate])

  const onSubmit = async (data) => {
    try {
      if (isCodeExpired) {
        showErrorToast('The code has expired. Please request a new one.')
        return
      }

      await verifyCode({ sessionToken: activeSessionToken, code: data.code })

      showSuccessToast('Email verified successfully. You can now sign in.')
      navigate('/login')
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to verify code. Please try again.'
      showErrorToast(message)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsResending(true)
      const response = await resendVerificationCode({ token: activeSessionToken })
      const nextExpiresAt = response.data?.properties?.expiresAt

      if (nextExpiresAt && activeSessionToken) {
        setVerificationExpiry({ sessionToken: activeSessionToken, expiresAt: nextExpiresAt })
      }

      setValue('code', '')
      setIsCodeExpired(false)
      setCountdownKey((previousKey) => previousKey + 1)
      showSuccessToast('A new verification code has been sent.')
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to resend code right now.'
      showErrorToast(message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="grid min-h-[calc(100svh-57px)] grid-cols-1 lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(5, 111, 108, 0.55), rgba(5, 111, 108, 0.55)), url('https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-8 bottom-10 text-[#f6f7ef]">
          <p className="text-sm tracking-[0.16em] uppercase">EMAIL VERIFICATION</p>
          <h1 className="mt-2 text-5xl leading-tight font-semibold">Almost there!</h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-4 lg:px-10 lg:py-5">
        <div className="w-full max-w-[440px]">
          <p className="mb-5 text-2xl text-[#c66b2b]">✶ <span>T a r a - B i s i t a C e b u</span></p>
          <h2 className="text-[42px] leading-tight font-semibold text-[#22211f]">
            Verify your email
          </h2>
          <p className="mt-1.5 mb-4 text-sm text-[#6f6a62]">
            Enter the 6-digit code sent to your email.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <VerificationCodeInput
                disabled={isSubmitting}
                length={6}
                value={code}
                onChange={(nextCode) =>
                  setValue('code', nextCode, { shouldDirty: true, shouldValidate: true })
                }
              />
              {errors.code && <p className="mt-2 text-xs text-[#bb3a2d]">{errors.code.message}</p>}
            </div>

            <VerificationCountdown
              key={countdownKey}
              initialSeconds={countdownSeconds}
              onExpire={() => setIsCodeExpired(true)}
            />

            <button
              className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting || isCodeExpired}
              type="submit"
            >
              {isSubmitting ? 'Verifying...' : 'Verify email'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#7a7269]">
            Didn&apos;t receive the code?{' '}
            <button
              className="cursor-pointer font-medium text-[#c66b2b] hover:text-[#a65821] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isResending}
              type="button"
              onClick={handleResendCode}
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default VerifyEmail
