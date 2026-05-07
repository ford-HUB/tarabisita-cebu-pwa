import { useState } from 'react'
import { FiEye, FiEyeOff, FiMapPin, FiBriefcase } from 'react-icons/fi'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { registerSchema } from '../../shared/validators/auth.validator'
import { useAuthStore } from '../../store/auth/auth.store'
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast.util'
import { useNavigate } from 'react-router-dom'
import { BUSINESS_CATEGORIES } from '../../shared/constants/businessCategories.constants'

const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [businessStep, setBusinessStep] = useState(1)
  const [hasAttemptedBusinessSubmit, setHasAttemptedBusinessSubmit] = useState(false)
  const registerUser = useAuthStore((state) => state.register)
  const sendVerificationCode = useAuthStore((state) => state.sendVerificationCode)
  const setVerificationExpiry = useAuthStore((state) => state.setVerificationExpiry)
  const defaultFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'TOURIST',
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessContact: '',
    businessCategory: '',
  }
  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount, touchedFields },
  } = useForm({
    defaultValues: defaultFormValues,
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const accountType = watch('accountType')
  const isBusiness = accountType === 'BUSINESS'
  const isBusinessDetailsStep = isBusiness && businessStep === 2

  const onSubmit = async (data) => {
    try {
      const isBusinessAccount = data.accountType === 'BUSINESS'
      const normalizedPayload = isBusinessAccount
        ? {
            ...data,
            businessName: data.businessName?.trim() || '',
            businessDescription: data.businessDescription?.trim() || '',
            businessAddress: data.businessAddress?.trim() || '',
            businessContact: data.businessContact?.trim() || '',
            businessCategory: data.businessCategory?.trim() || '',
          }
        : {
            name: data.name,
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            accountType: data.accountType,
          }

      await registerUser(normalizedPayload)
      const response = await sendVerificationCode({ email: data.email })
      const sessionToken = response.data.properties.sessionToken
      const expiresAt = response.data.properties.expiresAt
      setVerificationExpiry({ sessionToken, expiresAt })
      const query = new URLSearchParams({
        token: sessionToken,
        email: data.email,
      })
      navigate(`/verify-email?${query.toString()}`)
      showSuccessToast('Verification code sent to your email. Please check your inbox.')
      setHasAttemptedBusinessSubmit(false)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const handleBusinessNext = async () => {
    const isStepValid = await trigger(['name', 'email', 'password', 'confirmPassword'])
    if (isStepValid) {
      setBusinessStep(2)
      setHasAttemptedBusinessSubmit(false)
      showSuccessToast('Step 1 complete. Continue with your business details.', {
        duration: 2200,
      })
    } else {
      showErrorToast('Please complete the required account fields first.', { duration: 2200 })
    }
  }

  const inputClassName =
    'h-11 w-full rounded-xl border border-[#d7d2ca] bg-[#f5f3ef] px-4 text-sm text-[#2a2927] outline-none transition focus:border-[#c66b2b]'

  const errorTextClassName = 'mt-1 text-xs text-[#bb3a2d]'
  const resetBusinessFields = () => {
    const businessFields = [
      'businessName',
      'businessDescription',
      'businessAddress',
      'businessContact',
      'businessCategory',
    ]

    businessFields.forEach((field) => {
      setValue(field, '', { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    })
    clearErrors(businessFields)
  }

  const shouldShowStep1Errors = !isBusiness && submitCount > 0
  const shouldShowBusinessDetailsErrors = hasAttemptedBusinessSubmit
  const shouldShowTouchedError = (fieldName) => Boolean(touchedFields?.[fieldName])

  return (
    <main className="grid min-h-[calc(100svh-57px)] grid-cols-1 lg:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(5, 111, 108, 0.55), rgba(5, 111, 108, 0.55)), url('https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-8 bottom-10 text-[#f6f7ef]">
          <p className="text-sm tracking-[0.16em] uppercase">JOIN THE COMMUNITY</p>
          <h1 className="mt-2 text-5xl leading-tight font-semibold">Tara na, Sugbo!</h1>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        className="flex items-center justify-center px-6 py-4 lg:px-10 lg:py-5"
      >
        <div className="w-full max-w-[440px]">
        <p className="mb-5 text-2xl text-[#c66b2b]">✶ <span>T a r a - B i s i t a C e b u</span></p>
        <h2 className="text-[42px] leading-tight font-semibold text-[#22211f]">Create an account</h2>
          <p className="mt-1.5 mb-4 text-sm text-[#6f6a62]">Start your Cebu journey with TARA.</p>

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                  accountType === 'TOURIST'
                    ? 'border-[#d68843] bg-[#fbf5ed]'
                    : 'border-[#d7d2ca] bg-[#f5f3ef]'
                }`}
                type="button"
                onClick={() => {
                  reset(defaultFormValues)
                  setBusinessStep(1)
                  setHasAttemptedBusinessSubmit(false)
                }}
              >
                <FiMapPin className="text-[#8b7e70]" size={16} />
                  <span>
                  <span className="block text-[13px] font-medium text-[#2d2a26]">I&apos;m a Tourist</span>
                  <span className="block text-[11px] text-[#7d756b]">Explore and book experiences</span>
                </span>
              </button>

              <button
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                  accountType === 'BUSINESS'
                    ? 'border-[#d68843] bg-[#fbf5ed]'
                    : 'border-[#d7d2ca] bg-[#f5f3ef]'
                }`}
                type="button"
                onClick={() => {
                  reset({
                    ...defaultFormValues,
                    accountType: 'BUSINESS',
                  })
                  setBusinessStep(1)
                  setHasAttemptedBusinessSubmit(false)
                }}
              >
                <FiBriefcase className="text-[#8b7e70]" size={16} />
                <span>
                  <span className="block text-[13px] font-medium text-[#2d2a26]">I&apos;m an Owner</span>
                  <span className="block text-[11px] text-[#7d756b]">Manage your business</span>
                </span>
              </button>
            </div>

            {isBusiness && (
              <div className="rounded-xl border border-[#e7dfd4] bg-[#fcf8f3] px-3 py-2">
                <p className="text-xs font-medium text-[#6f6559]">
                  Step {businessStep} of 2: {businessStep === 1 ? 'Account Information' : 'Business Information'}
                </p>
              </div>
            )}

            {!isBusinessDetailsStep && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3a35]" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    className={inputClassName}
                    id="name"
                    placeholder="Juan Dela Cruz"
                    type="text"
                    {...register('name')}
                  />
                  {(shouldShowStep1Errors || shouldShowTouchedError('name')) && errors.name && (
                    <p className={errorTextClassName}>{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3a35]" htmlFor="email">
                    Email
                  </label>
                  <input
                    className={inputClassName}
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    {...register('email')}
                  />
                  {(shouldShowStep1Errors || shouldShowTouchedError('email')) && errors.email && (
                    <p className={errorTextClassName}>{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3a35]" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className={`${inputClassName} pr-11`}
                      id="password"
                      placeholder="Min. 6 characters"
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
                  {(shouldShowStep1Errors || shouldShowTouchedError('password')) && errors.password && (
                    <p className={errorTextClassName}>{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
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
                  {(shouldShowStep1Errors || shouldShowTouchedError('confirmPassword')) &&
                    errors.confirmPassword && (
                    <p className={errorTextClassName}>{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}

            {isBusinessDetailsStep && (
              <div className="space-y-4 rounded-2xl border border-[#e1dbd1] bg-[#fcfaf7] p-4">
                <h3 className="text-sm font-semibold text-[#3a352f]">Business Information</h3>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessName"
                  >
                    Business Name
                  </label>
                  <input
                    className={inputClassName}
                    id="businessName"
                    placeholder="Zubuchon"
                    type="text"
                    {...register('businessName')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessName && (
                    <p className={errorTextClassName}>{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessDescription"
                  >
                    Business Description
                  </label>
                  <input
                    className={inputClassName}
                    id="businessDescription"
                    placeholder="Describe your business"
                    type="text"
                    {...register('businessDescription')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessDescription && (
                    <p className={errorTextClassName}>{errors.businessDescription.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessAddress"
                  >
                    Business Address
                  </label>
                  <input
                    className={inputClassName}
                    id="businessAddress"
                    placeholder="Cebu City"
                    type="text"
                    {...register('businessAddress')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessAddress && (
                    <p className={errorTextClassName}>{errors.businessAddress.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessContact"
                  >
                    Business Contact
                  </label>
                  <input
                    className={inputClassName}
                    id="businessContact"
                    placeholder="+63 900 000 0000"
                    type="text"
                    {...register('businessContact')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessContact && (
                    <p className={errorTextClassName}>{errors.businessContact.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessCategory"
                  >
                    Business Category
                  </label>
                  <select
                    className={inputClassName}
                    id="businessCategory"
                    {...register('businessCategory')}
                  >
                    <option value="">Select a category</option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {shouldShowBusinessDetailsErrors && errors.businessCategory && (
                    <p className={errorTextClassName}>{errors.businessCategory.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-1 flex gap-2">
              {isBusinessDetailsStep && (
                <button
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-[#d7d2ca] bg-[#f5f3ef] font-semibold text-[#2a2927] transition hover:bg-[#ece8e2]"
                  type="button"
                  onClick={() => {
                    setBusinessStep(1)
                    setHasAttemptedBusinessSubmit(false)
                  }}
                >
                  Back
                </button>
              )}

              <button
                className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
                disabled={isSubmitting}
                type={isBusiness && businessStep === 1 ? 'button' : 'submit'}
                onClick={
                  isBusiness && businessStep === 1
                    ? handleBusinessNext
                    : isBusinessDetailsStep
                      ? () => setHasAttemptedBusinessSubmit(true)
                      : undefined
                }
              >
                {isBusiness && businessStep === 1
                  ? 'Next: Business details'
                  : isSubmitting
                    ? 'Creating account...'
                    : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </motion.section>
    </main>
  )
}

export default Register
