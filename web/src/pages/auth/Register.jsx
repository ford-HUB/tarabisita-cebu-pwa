import { useCallback, useEffect, useRef, useState } from 'react'
import { FiEye, FiEyeOff, FiLoader, FiMapPin, FiBriefcase } from 'react-icons/fi'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { registerSchema } from '../../shared/validators/auth.validator'
import { useAuthStore } from '../../store/auth/auth.store'
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast.util'
import { useNavigate } from 'react-router-dom'
import { BUSINESS_CATEGORIES } from '../../shared/constants/businessCategories.constants'
import { BUSINESS_CATEGORY_DESCRIPTION_BY_VALUE } from '../../shared/constants/businessCategoryDescriptions.constants'
import CebuCityAutocomplete from '../../components/auth/CebuCityAutocomplete'
import {
  REGISTRATION_ERROR_CODES,
  getRegistrationErrorMessage,
} from '../../shared/constants/registrationErrors.constants'

/** Basic shape check before calling the mail-checker API (avoids spam while typing). */
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const EMAIL_CHECK_DEBOUNCE_MS = 450

const verifiedEmailTakenMessage = (accountRole) => {
  if (accountRole === 'BUSINESS') {
    return 'This email is already verified and is registered to a business account. Someone is already using it—please sign in or use a different email.'
  }
  if (accountRole === 'TOURIST') {
    return 'This email is already verified and is registered to a tourist account. Someone is already using it—please sign in or use a different email.'
  }
  return 'This email is already verified and is already taken by an existing account. Please sign in or use a different email.'
}

const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [businessStep, setBusinessStep] = useState(1)
  const [hasAttemptedBusinessSubmit, setHasAttemptedBusinessSubmit] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const submitInFlightRef = useRef(false)
  const registerUser = useAuthStore((state) => state.register)
  const sendVerificationCode = useAuthStore((state) => state.sendVerificationCode)
  const mailChecker = useAuthStore((state) => state.mailChecker)
  const setVerificationExpiry = useAuthStore((state) => state.setVerificationExpiry)
  const [emailStatus, setEmailStatus] = useState({
    state: 'idle', // idle | checking | ok | not_found | error
    exists: false,
    isEmailVerified: false,
    canReuseForSignup: false,
    registrationBlocked: false,
    accountRole: null,
    message: '',
  })
  const latestEmailCheckIdRef = useRef(0)
  const defaultFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'TOURIST',
    businessName: '',
    businessDescription: '',
    businessCity: '',
    businessDistrict: '',
    businessStreet: '',
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
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount, touchedFields },
  } = useForm({
    defaultValues: defaultFormValues,
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const accountType = watch('accountType')
  const emailValue = watch('email')
  const businessCategory = watch('businessCategory')
  const businessCity = watch('businessCity')
  const isBusiness = accountType === 'BUSINESS'
  const isBusinessDetailsStep = isBusiness && businessStep === 2

  const handleEmailCheck = useCallback(
    async (rawEmail, { forSubmit = false } = {}) => {
      const nextEmail = String(rawEmail || '').trim().toLowerCase()
      if (!nextEmail) {
        setEmailStatus({
          state: 'idle',
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
          message: '',
        })
        return {
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
        }
      }

      const checkId = forSubmit ? latestEmailCheckIdRef.current : latestEmailCheckIdRef.current + 1
      if (!forSubmit) {
        latestEmailCheckIdRef.current = checkId
      }
      setEmailStatus((previous) => ({
        ...previous,
        state: 'checking',
        message: '',
        exists: false,
        isEmailVerified: false,
        canReuseForSignup: false,
        registrationBlocked: false,
        accountRole: null,
      }))

      try {
        const response = await mailChecker({ email: nextEmail })
        if (!forSubmit && latestEmailCheckIdRef.current !== checkId) return

        const properties = response?.data?.properties || {}
        const exists = Boolean(properties.exists)
        const isEmailVerified = Boolean(properties.isEmailVerified)
        const canReuseForSignup = Boolean(properties.canReuseForSignup)
        const registrationBlocked = Boolean(properties.registrationBlocked)
        const accountRole = properties.accountRole ? String(properties.accountRole) : null

        if (exists && registrationBlocked && !canReuseForSignup) {
          setEmailStatus({
            state: 'ok',
            exists: true,
            isEmailVerified,
            canReuseForSignup: false,
            registrationBlocked: true,
            accountRole,
            message: isEmailVerified
              ? verifiedEmailTakenMessage(accountRole)
              : 'This email is linked to another account as a support email and cannot be used for a new signup. Please sign in or use a different email.',
          })
          return {
            exists: true,
            isEmailVerified,
            canReuseForSignup: false,
            registrationBlocked: true,
            accountRole,
          }
        }

        if (exists && canReuseForSignup) {
          setEmailStatus({
            state: 'ok',
            exists: true,
            isEmailVerified: false,
            canReuseForSignup: true,
            registrationBlocked: false,
            accountRole,
            message:
              accountRole === 'BUSINESS'
                ? 'This email is already used for a business signup but is not verified yet. You can continue—we’ll send a new verification code to finish setting up that account.'
                : 'This email is already registered but not verified yet. You can reuse it—we’ll send you a new verification code.',
          })
          return {
            exists: true,
            isEmailVerified: false,
            canReuseForSignup: true,
            registrationBlocked: false,
            accountRole,
          }
        }

        setEmailStatus({
          state: 'ok',
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
          message: 'This email is available to register.',
        })
        return {
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
        }
      } catch (error) {
        if (!forSubmit && latestEmailCheckIdRef.current !== checkId) return

        const status = error?.response?.status
        if (status === 404) {
          setEmailStatus({
            state: 'not_found',
            exists: false,
            isEmailVerified: false,
            canReuseForSignup: false,
            registrationBlocked: false,
            accountRole: null,
            message: 'This email is available to register.',
          })
          return {
            exists: false,
            isEmailVerified: false,
            canReuseForSignup: false,
            registrationBlocked: false,
            accountRole: null,
          }
        }

        setEmailStatus({
          state: 'error',
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
          message: 'Unable to check email right now. Please try again.',
        })
        return {
          exists: false,
          isEmailVerified: false,
          canReuseForSignup: false,
          registrationBlocked: false,
          accountRole: null,
        }
      }
    },
    [mailChecker]
  )

  useEffect(() => {
    if (isBusinessDetailsStep) {
      return undefined
    }

    const trimmed = String(emailValue || '').trim()
    if (!trimmed) {
      setEmailStatus({
        state: 'idle',
        exists: false,
        isEmailVerified: false,
        canReuseForSignup: false,
        registrationBlocked: false,
        accountRole: null,
        message: '',
      })
      return undefined
    }

    if (!looksLikeEmail(trimmed)) {
      setEmailStatus((previous) => ({
        ...previous,
        state: 'idle',
        exists: false,
        isEmailVerified: false,
        canReuseForSignup: false,
        registrationBlocked: false,
        accountRole: null,
        message: '',
      }))
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      void handleEmailCheck(trimmed)
    }, EMAIL_CHECK_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [emailValue, handleEmailCheck, isBusinessDetailsStep])

  useEffect(() => {
    if (!businessCategory) return

    const presetDescription = BUSINESS_CATEGORY_DESCRIPTION_BY_VALUE[businessCategory]
    if (presetDescription) {
      setValue('businessDescription', presetDescription, {
        shouldDirty: true,
        shouldValidate: hasAttemptedBusinessSubmit,
      })
    }
  }, [businessCategory, hasAttemptedBusinessSubmit, setValue])

  const handleRegistrationApiError = (error, normalizedEmail) => {
    const status = error?.response?.status
    const code = error?.response?.data?.code
    const message = error?.response?.data?.message

    if (code === REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL || status === 409) {
      setError('email', { type: 'manual', message: 'This email is already registered.' })
      showErrorToast(getRegistrationErrorMessage(REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL))
      void handleEmailCheck(normalizedEmail, { forSubmit: true })
      return
    }

    if (code === REGISTRATION_ERROR_CODES.PROFILE_SETUP_FAILED) {
      showErrorToast(getRegistrationErrorMessage(REGISTRATION_ERROR_CODES.PROFILE_SETUP_FAILED))
      return
    }

    showErrorToast(getRegistrationErrorMessage(code, message))
  }

  const onSubmit = async (data) => {
    if (submitInFlightRef.current) {
      return
    }

    const normalizedEmail = String(data.email || '').trim().toLowerCase()
    submitInFlightRef.current = true
    setIsRegistering(true)

    try {
      const freshEmailCheck = await handleEmailCheck(normalizedEmail, { forSubmit: true })
      if (freshEmailCheck?.registrationBlocked) {
        setError('email', { type: 'manual', message: 'This email is already registered.' })
        showErrorToast(
          freshEmailCheck.isEmailVerified
            ? verifiedEmailTakenMessage(freshEmailCheck.accountRole)
            : 'This email is already registered.'
        )
        return
      }

      const isBusinessAccount = data.accountType === 'BUSINESS'
      const normalizedPayload = isBusinessAccount
        ? {
            name: data.name,
            email: normalizedEmail,
            password: data.password,
            confirmPassword: data.confirmPassword,
            accountType: data.accountType,
            businessName: data.businessName?.trim() || '',
            businessDescription: data.businessDescription?.trim() || '',
            businessAddress: [data.businessStreet, data.businessDistrict, data.businessCity]
              .map((part) => String(part || '').trim())
              .filter(Boolean)
              .join(', '),
            businessContact: data.businessContact?.trim() || '',
            businessCategory: data.businessCategory?.trim() || '',
          }
        : {
            name: data.name,
            email: normalizedEmail,
            password: data.password,
            confirmPassword: data.confirmPassword,
            accountType: data.accountType,
          }

      await registerUser(normalizedPayload)

      try {
        const response = await sendVerificationCode({ email: normalizedEmail })
        const sessionToken = response.data.properties.sessionToken
        const expiresAt = response.data.properties.expiresAt
        setVerificationExpiry({ sessionToken, expiresAt })
        const query = new URLSearchParams({
          token: sessionToken,
          email: normalizedEmail,
        })
        navigate(`/verify-email?${query.toString()}`)
        showSuccessToast(
          freshEmailCheck?.canReuseForSignup
            ? 'Account found but not verified. We sent a new verification code to your email.'
            : 'Account created successfully. Verification code sent to your email.'
        )
        setHasAttemptedBusinessSubmit(false)
      } catch (sendError) {
        showErrorToast(
          sendError?.response?.data?.message ||
            'Account was created, but we could not send the verification email. Please sign in and request a new code.'
        )
        navigate('/login')
      }
    } catch (error) {
      handleRegistrationApiError(error, normalizedEmail)
    } finally {
      submitInFlightRef.current = false
      setIsRegistering(false)
    }
  }

  const handleBusinessNext = async () => {
    const trimmed = String(emailValue || '').trim()
    if (looksLikeEmail(trimmed)) {
      const checked = await handleEmailCheck(trimmed)
      if (checked?.registrationBlocked) {
        setError('email', { type: 'manual', message: 'This email is already taken.' })
        showErrorToast(
          checked?.isEmailVerified
            ? verifiedEmailTakenMessage(checked.accountRole)
            : 'This email is linked to another account and cannot be used for a new signup. Please sign in or use a different email.'
        )
        return
      }
    }

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
      'businessCity',
      'businessDistrict',
      'businessStreet',
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

  /** Email cannot be used for a new signup (verified account or support-email conflict). */
  const isEmailUnavailableForRegister =
    emailStatus.state === 'ok' && emailStatus.registrationBlocked

  const trimmedEmailValue = String(emailValue || '').trim()
  const emailLooksComplete = looksLikeEmail(trimmedEmailValue)
  /** Step where the email field is shown (tourist-only flow or business account step 1). */
  const isOnEmailCaptureStep = !isBusiness || businessStep === 1
  /** Wait for mail-checker to finish so “Next” / “Create account” cannot race ahead of availability. */
  const isEmailAvailabilityPending =
    isOnEmailCaptureStep && emailLooksComplete && emailStatus.state === 'checking'

  const isProcessingRegistration = isSubmitting || isRegistering

  const disablePrimaryRegisterAction =
    isProcessingRegistration || isEmailUnavailableForRegister || isEmailAvailabilityPending

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
                    autoComplete="email"
                    {...register('email')}
                  />
                  {(emailStatus.state === 'checking' || emailStatus.message) && (
                    <span
                      role="status"
                      aria-live="polite"
                      className={`mt-1 block text-xs ${
                        emailStatus.state === 'error' || emailStatus.registrationBlocked
                          ? 'text-[#bb3a2d]'
                          : emailStatus.canReuseForSignup
                            ? 'text-[#6f6a62]'
                            : 'text-[#4a7c59]'
                      }`}
                    >
                      {emailStatus.state === 'checking' ? 'Checking email...' : emailStatus.message}
                    </span>
                  )}
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
                    htmlFor="businessCity"
                  >
                    City
                  </label>
                  <CebuCityAutocomplete
                    errorMessage={errors.businessCity?.message}
                    errorTextClassName={errorTextClassName}
                    inputClassName={inputClassName}
                    shouldShowError={shouldShowBusinessDetailsErrors}
                    value={businessCity}
                    onChange={(nextCity) => {
                      setValue('businessCity', nextCity, {
                        shouldDirty: true,
                        shouldValidate: hasAttemptedBusinessSubmit,
                      })
                    }}
                    onSelectSuggestion={(suggestion) => {
                      setValue('businessDistrict', suggestion.district || '', {
                        shouldDirty: true,
                        shouldValidate: hasAttemptedBusinessSubmit,
                      })
                      setValue('businessStreet', suggestion.street || '', {
                        shouldDirty: true,
                        shouldValidate: hasAttemptedBusinessSubmit,
                      })
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessDistrict"
                  >
                    District
                  </label>
                  <input
                    className={inputClassName}
                    id="businessDistrict"
                    placeholder="Lahug"
                    type="text"
                    {...register('businessDistrict')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessDistrict && (
                    <p className={errorTextClassName}>{errors.businessDistrict.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-[#3f3a35]"
                    htmlFor="businessStreet"
                  >
                    Street
                  </label>
                  <input
                    className={inputClassName}
                    id="businessStreet"
                    placeholder="Acacia Street"
                    type="text"
                    {...register('businessStreet')}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessStreet && (
                    <p className={errorTextClassName}>{errors.businessStreet.message}</p>
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
                    inputMode="numeric"
                    placeholder="09091****19"
                    type="text"
                    {...register('businessContact', {
                      onChange: (event) => {
                        event.target.value = event.target.value.replace(/\D/g, '')
                      },
                    })}
                  />
                  {shouldShowBusinessDetailsErrors && errors.businessContact && (
                    <p className={errorTextClassName}>{errors.businessContact.message}</p>
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
                aria-busy={isProcessingRegistration}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff7a1a] font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-75"
                disabled={disablePrimaryRegisterAction}
                type={isBusiness && businessStep === 1 ? 'button' : 'submit'}
                onClick={
                  isBusiness && businessStep === 1
                    ? handleBusinessNext
                    : isBusinessDetailsStep
                      ? () => setHasAttemptedBusinessSubmit(true)
                      : undefined
                }
              >
                {isProcessingRegistration && !(isBusiness && businessStep === 1) ? (
                  <>
                    <FiLoader aria-hidden className="animate-spin" size={18} />
                    Creating account...
                  </>
                ) : isBusiness && businessStep === 1 ? (
                  'Next: Business details'
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.section>
    </main>
  )
}

export default Register
