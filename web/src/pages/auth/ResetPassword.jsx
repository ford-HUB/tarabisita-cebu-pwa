import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordSchema } from '../../shared/validators/auth.validator'
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast.util'
import { useAuthStore } from '../../store/auth/auth.store'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [runningToken, setRunningToken] = useState(searchParams.get('token') || '')
  const resetPassword = useAuthStore((state) => state.resetPassword)


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data) => {
    try {
      await resetPassword({ token: runningToken, password: data.password, confirmPassword: data.confirmPassword })
      showSuccessToast('Password updated. You can now sign in.')
      navigate('/login')
    } catch (error) {
      const message = error?.response?.data?.message
      showErrorToast(message)
    }
  }

  const inputClassName =
    'h-11 w-full rounded-xl border border-[#d7d2ca] bg-[#f5f3ef] px-4 text-sm text-[#2a2927] outline-none transition focus:border-[#c66b2b]'
  const errorTextClassName = 'mt-1 text-xs text-[#bb3a2d]'

  return (
    <main className="grid min-h-[calc(100svh-57px)] grid-cols-1 lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(5, 111, 108, 0.55), rgba(5, 111, 108, 0.55)), url('https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-8 bottom-10 text-[#f6f7ef]">
          <p className="text-sm tracking-[0.16em] uppercase">RESET PASSWORD</p>
          <h1 className="mt-2 text-5xl leading-tight font-semibold">Set a new password</h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-4 lg:px-10 lg:py-5">
        <div className="w-full max-w-[440px]">
          <p className="mb-5 text-2xl text-[#c66b2b]">
            ✶ <span>T a r a - B i s i t a C e b u</span>
          </p>
          <h2 className="text-[42px] leading-tight font-semibold text-[#22211f]">
            Reset password
          </h2>
          <p className="mt-1.5 mb-5 text-sm text-[#6f6a62]">
            Create a strong password you don&apos;t use elsewhere.
          </p>

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#3f3a35]" htmlFor="password">
                New password
              </label>
              <div className="relative">
                <input
                  className={`${inputClassName} pr-11`}
                  id="password"
                  placeholder="New password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#7a7065]"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className={errorTextClassName}>{errors.password.message}</p>}
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[#3f3a35]"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  className={`${inputClassName} pr-11`}
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                />
                <button
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#7a7065]"
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={errorTextClassName}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#7a7269]">
            Remembered your password?{' '}
            <a className="font-medium text-[#c66b2b] hover:text-[#a65821]" href="/login">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default ResetPassword
