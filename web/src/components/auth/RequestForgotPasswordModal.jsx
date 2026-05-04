import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { forgotPasswordSchema } from '../../shared/validators/auth.validator'
import { useAuthStore } from '../../store/auth/auth.store'

const RequestForgotPassword = ({ isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  })

  const [emailCheck, setEmailCheck] = useState({
    status: 'idle',
    message: '',
  })
  const debounceTimeoutRef = useRef(null)
  const latestRequestIdRef = useRef(0)
  const emailValue = watch('email')

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  useEffect(() => {
    if (!isOpen) {
      setEmailCheck({ status: 'idle', message: '' })
      return
    }

    const email = (emailValue || '').trim()

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    if (!email) {
      setEmailCheck({ status: 'idle', message: '' })
      return
    }

    // This regex preventing for calling the API for clearly invalid emails.
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!looksLikeEmail) {
      setEmailCheck({ status: 'idle', message: '' })
      return
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const requestId = ++latestRequestIdRef.current
      setEmailCheck({ status: 'checking', message: 'Checking email...' })

      try {
        const response = await useAuthStore.getState().mailChecker({ email })
        if (latestRequestIdRef.current !== requestId) return

        setEmailCheck({
          status: 'found',
          message: response.data?.message,
        })
      } catch (error) {
        if (latestRequestIdRef.current !== requestId) return

        const status = error?.response?.status
        const message = error?.response?.data?.message || error?.message || 'Failed to check email.'

        if (status === 404) {
          setEmailCheck({ status: 'not_found', message })
          return
        }

        setEmailCheck({ status: 'error', message })
      }
    }, 450)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
    }
  }, [emailValue, isOpen])

  if (!isOpen) return null

  const onFormSubmit = (data) => {
    onSubmit(data.email)
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-xl font-semibold text-[#1c1a18]">Forgot Password</h3>
        <p className="mb-4 text-sm text-[#6c655d]">Enter your email to request a reset link.</p>

        <form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
          <input
            className="h-12 w-full rounded-lg border border-[#dfd7cd] bg-white px-4 outline-none transition focus:border-[#c66b2b]"
            placeholder="you@example.com"
            type="email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-[#bb3a2d]">{errors.email.message}</p>}
          {!errors.email && emailCheck.status !== 'idle' && (
            <p
              className={[
                'mt-1 text-xs',
                emailCheck.status === 'checking'
                  ? 'text-[#6c655d]'
                  : emailCheck.status === 'found'
                    ? 'text-[#1f7a2e]'
                    : 'text-[#bb3a2d]',
              ].join(' ')}
            >
              {emailCheck.message}
            </p>
          )}
          <button
            className="h-12 w-full cursor-pointer rounded-lg bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequestForgotPassword
