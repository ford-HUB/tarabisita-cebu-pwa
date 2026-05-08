import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { loginSchema } from '../../shared/validators/auth.validator'
import RequestForgotPassword from '../../components/auth/RequestForgotPasswordModal'
import { useAuthStore } from '../../store/auth/auth.store'
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast.util'
import { roleBasedRoute } from '../../shared/utils/direct.utils'

const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const login = useAuthStore((state) => state.login)
  const requestForgotPassword = useAuthStore((state) => state.requestForgotPassword)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data) => {
    try {
      const response = await login(data)
      const role = response.data?.properties?.user?.role
      const nextRaw = String(searchParams.get('next') || '').trim()
      const safeNext = nextRaw.startsWith('/') ? nextRaw : ''
      if (safeNext) {
        navigate(safeNext)
      } else {
        const destin_url = roleBasedRoute(role)
        navigate(`/${destin_url}`)
      }
      showSuccessToast('Welcome back! You are now signed in.')
    } catch (error) {
      showErrorToast(error?.response?.data?.message)
    }
  }

  const handleForgotPassword = async (email) => {
    await requestForgotPassword(email)
    showSuccessToast('Reset link request sent. Please check your email.')
    setIsForgotPasswordOpen(false)
  }

  const inputClassName =
    'h-12 w-full rounded-lg border border-[#dfd7cd] bg-white px-4 outline-none transition focus:border-[#c66b2b]'
  const errorTextClassName = 'mt-1 text-xs text-[#bb3a2d]'

  return (
    <main className="grid min-h-[calc(100svh-60px)] grid-cols-1 lg:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(183, 93, 30, 0.45), rgba(183, 93, 30, 0.45)), url('https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=900&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-8 bottom-8 max-w-md text-[#fff9ef]">
          <p className="mb-3 text-sm tracking-[0.18em] uppercase">Cebu, Philippines</p>
          <h1 className="mb-4 text-5xl leading-tight font-semibold">
            The Pearl of
            <br />
            the Orient Seas
          </h1>
          <p className="text-lg text-[#fff1dd]">
            Discover paradise, taste authentic Cebuano flavors, and create memories that last a
            lifetime.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        className="flex items-center justify-center px-6 py-10 lg:px-12"
      >
        <div className="w-full max-w-[460px]">
          <p className="mb-5 text-2xl text-[#c66b2b]">✶ <span>T a r a - B i s i t a C e b u</span></p>
          <h2 className="mb-2 text-5xl leading-tight font-semibold text-[#1c1a18]">
            Maayong balik!
          </h2>
          <p className="mb-8 text-[#6c655d]">Sign in to continue your Cebu adventure.</p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3f3a35]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={inputClassName}
                placeholder="you@example.com"
                type="email"
                {...register('email')}
              />
              {errors.email && <p className={errorTextClassName}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3f3a35]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className={`${inputClassName} pr-11`}
                  placeholder="Your password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute cursor-pointer top-1/2 right-3 -translate-y-1/2 text-[#6e6559]"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className={errorTextClassName}>{errors.password.message}</p>}
            </div>

            <button
              className="cursor-pointer flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting}
              type="submit"
            >
              <span className="text-sm">↪</span> {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="my-5 text-center text-sm text-[#7a7269]">Or</p>

          <p className="mt-6 text-center text-sm text-[#7a7269]">
            No account yet?{' '}
            <a className="font-medium text-[#c66b2b] hover:text-[#a65821]" href="/register">
              Register here
            </a>
          </p>
          <p className="mt-2 text-center text-sm">
            <button
              className="cursor-pointer font-medium text-[#c66b2b] hover:text-[#a65821]"
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
            >
              Forgot password?
            </button>
          </p>
        </div>
      </motion.section>
      <RequestForgotPassword
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSubmit={handleForgotPassword}
      />
    </main>
  )
}

export default Login