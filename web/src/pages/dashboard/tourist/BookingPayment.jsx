import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { touristExploreHref, touristOrdersHref } from '../../../components/layout/tourist/touristLayout.constants.js'
import {
  postMyBookingPaymentLinkCheckout,
  postMyBookingPaymentLinkResolve
} from '../../../services/tourist/touristCustomerOrder.service.js'
import { TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS } from '../../../components/tourist/checkout/touristBillingPaymentOptions.jsx'
import { checkoutPaymentLogos } from '../../../components/business/profile/ui/index.js'
import PaymentPreferenceMark from '../../../components/tourist/checkout/PaymentPreferenceMark.jsx'
import {
  assignXenditCheckout,
  isTrustedXenditCheckoutUrl
} from '../../../shared/utils/xenditCheckoutRedirect.utils.js'

const formatPhp = (amount) => {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '₱0.00'
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const BookingPayment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentToken = String(searchParams.get('t') || '').trim()

  const [isLoading, setIsLoading] = useState(true)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [booking, setBooking] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('GCASH')
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD'])
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    let timer
    if (errorMessage) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate('/login', { replace: true })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [errorMessage, navigate])

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!paymentToken) {
        setErrorMessage('Invalid payment link.')
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setErrorMessage('')
      try {
        const res = await postMyBookingPaymentLinkResolve(paymentToken)
        if (!active) return
        const bookingData = res?.data?.data || null
        const methods = Array.isArray(bookingData?.availablePaymentMethods)
          ? bookingData.availablePaymentMethods
          : ['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']
        setBooking(bookingData)
        setAvailablePaymentMethods(methods)
        setPaymentMethod((prev) => (methods.includes(prev) ? prev : methods[0] || 'GCASH'))
      } catch (error) {
        if (!active) return
        setErrorMessage(error?.response?.data?.message || 'Could not verify payment link.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [paymentToken])

  const isApproved = useMemo(
    () => String(booking?.orderStatus || '').toUpperCase() === 'PROCESSING',
    [booking?.orderStatus]
  )
  const hasAvailablePaymentMethods = availablePaymentMethods.length > 0

  const startPayment = async () => {
    if (!paymentToken) return
    setIsStartingCheckout(true)
    try {
      const res = await postMyBookingPaymentLinkCheckout(paymentToken, {
        returnBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
        paymentMethod
      })
      const checkoutUrl = res?.data?.data?.checkoutUrl
      if (!checkoutUrl || !isTrustedXenditCheckoutUrl(checkoutUrl)) {
        toast.error('Invalid payment checkout link.')
        return
      }
      assignXenditCheckout(checkoutUrl)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not start booking payment.')
    } finally {
      setIsStartingCheckout(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#e7dfd5] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#5b5b5b]">Verifying your secure payment link...</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-[#7a271a]">Payment link unavailable</h1>
          <p className="mt-3 text-sm text-[#7a271a]">{errorMessage}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-full bg-[#1f1f1f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Go back home
            </button>
            <p className="text-xs font-medium text-[#a04e40]">
              Redirecting automatically in {countdown}s...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f] md:text-2xl">Booking Payment</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          This secure link is time-limited. Continue to payment to confirm your approved booking.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-[#9a8f83]">Booking details</p>
        <h2 className="mt-2 text-lg font-semibold text-[#1f1f1f]">{booking?.productName || 'Booking request'}</h2>
        <p className="mt-1 text-sm text-[#5b5b5b]">{booking?.businessName || 'Resort'}</p>
        <div className="mt-4 grid gap-2 text-sm text-[#3f3f3f] sm:grid-cols-2">
          <p>
            <span className="text-[#7a726a]">Code:</span> {booking?.orderCode || '--'}
          </p>
          <p>
            <span className="text-[#7a726a]">Status:</span> {booking?.orderStatus || '--'}
          </p>
          <p className="sm:col-span-2">
            <span className="text-[#7a726a]">Amount:</span>{' '}
            <span className="font-semibold text-[#ff7a1a]">{formatPhp(booking?.amount)}</span>
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#efe6dc] bg-[#fbf9f6] p-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#a79a8b]">Payment option</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS.map((opt) => {
              const selected = paymentMethod === opt.value
              const disabled = !availablePaymentMethods.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (disabled) return
                    setPaymentMethod(opt.value)
                  }}
                  disabled={disabled}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    disabled
                      ? 'cursor-not-allowed border-[#ece5dc] bg-[#f5f1eb] opacity-60'
                      : selected
                      ? 'border-[#ff7a1a] bg-[#fff8f2] shadow-sm ring-2 ring-[#ff7a1a]/30'
                      : 'border-[#e7dfd5] bg-white hover:border-[#d4c4b6]'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${opt.iconWrapClass}`}
                    aria-hidden
                  >
                    <PaymentPreferenceMark option={opt} iconSrc={checkoutPaymentLogos[opt.value]} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{opt.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#5b5b5b]">
                      {disabled ? 'Unavailable for this business' : opt.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#efe6dc] bg-[#fbf9f6] p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#1f1f1f]">
          <span className="font-medium">Total to pay</span>{' '}
          <span className="text-lg font-semibold text-[#ff7a1a]">{formatPhp(booking?.amount)}</span>
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="rounded-full border border-[#e7dfd5] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a4a4a] transition hover:bg-[#f7f3ed]"
          >
            Return to site
          </button>
          <button
            type="button"
            disabled={!isApproved || isStartingCheckout || !hasAvailablePaymentMethods}
            onClick={startPayment}
            className="rounded-full bg-[#1f1f1f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStartingCheckout ? 'Starting payment...' : `Continue with ${paymentMethod}`}
          </button>
        </div>
      </div>
      {!hasAvailablePaymentMethods ? (
        <p className="rounded-xl border border-[#f0dcc7] bg-[#fff9f3] px-3 py-2 text-center text-xs text-[#7a624e]">
          This business has no online payment methods enabled right now.
        </p>
      ) : null}
    </div>
  )
}

export default BookingPayment
