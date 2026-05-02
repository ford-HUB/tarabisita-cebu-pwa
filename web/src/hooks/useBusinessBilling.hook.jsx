import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  subscriptionEffectiveStatusLabels,
  subscriptionPlanIdLabels
} from '../components/business/billing/constants/billing.constants'
import {
  BILLING_PAYMENT_TOAST_DURATION_SECONDS,
  billingPaymentReturnToastConfig
} from '../shared/constants/billing.constants'
import {
  createBusinessBillingCheckout,
  getMyBusinessBillingLedger,
  updateMyBusinessProfile
} from '../services/business/business.service'
import {
  buildUpdateProfilePayloadFromBillingForm,
  formatBillingDateTime,
  formatBillingPeso
} from '../shared/utils/billingDisplay.utils'
import { useBusinessBillingProfile } from './useBusinessBillingProfile.hook'

/**
 * Billing page controller: profile rows, checkout, billing-address save, plan modals, payment return UX.
 * Mirrors the Profile page pattern (thin page + dedicated hook).
 */
export const useBusinessBilling = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [processingPlanId, setProcessingPlanId] = useState(null)
  const [isAvailablePlansModalOpen, setIsAvailablePlansModalOpen] = useState(false)
  const [isCompareFeaturesModalOpen, setIsCompareFeaturesModalOpen] = useState(false)
  const [ledgerPayments, setLedgerPayments] = useState([])
  const [ledgerSubscriptions, setLedgerSubscriptions] = useState([])
  const [isLedgerLoading, setIsLedgerLoading] = useState(true)

  const {
    profileData,
    displayRows,
    billingAddressFormDefaults,
    isLoading: isBillingProfileLoading,
    refetchProfile
  } = useBusinessBillingProfile()

  const loadLedger = useCallback(async () => {
    try {
      setIsLedgerLoading(true)
      const res = await getMyBusinessBillingLedger()
      const data = res?.data?.data
      setLedgerPayments(Array.isArray(data?.payments) ? data.payments : [])
      setLedgerSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : [])
    } catch {
      setLedgerPayments([])
      setLedgerSubscriptions([])
    } finally {
      setIsLedgerLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  const planSubscriptionSummary = useMemo(() => {
    if (!profileData) {
      return null
    }

    const sub = profileData.subscription || {}
    const effective = sub.effectiveStatus || sub.status || 'INACTIVE'
    const planTitle =
      subscriptionPlanIdLabels[sub.planId] ||
      (sub.months ? `${sub.months}-month prepaid plan` : 'Paid plan')

    return {
      effectiveStatus: effective,
      statusLabel: subscriptionEffectiveStatusLabels[effective] || String(effective).replace(/_/g, ' '),
      planTitle,
      cycleLabel: sub.months ? `${sub.months}-month billing cycle` : '—',
      amountLabel: formatBillingPeso(sub.amount),
      startedAtLabel: formatBillingDateTime(sub.startedAt),
      expiresAtLabel: formatBillingDateTime(sub.expiresAt)
    }
  }, [profileData])

  const hasActivePlan = planSubscriptionSummary?.effectiveStatus === 'ACTIVE'

  const showPastOrFailedPlan =
    Boolean(planSubscriptionSummary) &&
    planSubscriptionSummary.effectiveStatus !== 'INACTIVE' &&
    !hasActivePlan

  const billingAccountSummary = useMemo(() => {
    if (!profileData) {
      return null
    }
    const b = profileData.billing || {}
    return {
      lastStatus: b.lastStatus || 'NONE',
      lastAmountLabel: formatBillingPeso(b.lastAmount),
      lastPaidAtLabel: formatBillingDateTime(b.lastPaidAt)
    }
  }, [profileData])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (!paymentStatus) {
      return
    }

    if (paymentStatus === 'success') {
      void refetchProfile()
      void loadLedger()
    } else {
      void loadLedger()
    }

    const config = billingPaymentReturnToastConfig[paymentStatus]
    if (config) {
      const toastId = `billing-payment-${paymentStatus}-${Date.now()}`
      let secondsLeft = BILLING_PAYMENT_TOAST_DURATION_SECONDS

      const renderToast = () => (
        <div className="flex min-w-[280px] items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#9b5a2c]" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[#2f2f2f]">{config.title}</p>
            <p className="text-xs text-[#6d645d]">{config.message}</p>
            <p className="text-[11px] text-[#9f9387]">Closing in {secondsLeft}s...</p>
          </div>
        </div>
      )

      toast.custom(renderToast, {
        id: toastId,
        duration: BILLING_PAYMENT_TOAST_DURATION_SECONDS * 1000
      })

      const timerId = window.setInterval(() => {
        secondsLeft -= 1
        if (secondsLeft <= 0) {
          window.clearInterval(timerId)
          toast.dismiss(toastId)
          return
        }
        toast.custom(renderToast, {
          id: toastId,
          duration: secondsLeft * 1000
        })
      }, 1000)
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('payment')
    nextParams.delete('plan')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams, refetchProfile, loadLedger])

  const handleChoosePlan = useCallback(async (plan) => {
    try {
      setProcessingPlanId(plan.id)
      const response = await createBusinessBillingCheckout({
        months: plan.months,
        returnBaseUrl: window.location.origin
      })
      const checkoutUrl = response?.data?.data?.checkoutUrl

      if (!checkoutUrl) {
        throw new Error('Checkout URL is missing.')
      }

      window.location.assign(checkoutUrl)
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to start PayMongo checkout.')
      setProcessingPlanId(null)
    }
  }, [])

  const handleBillingAddressSave = useCallback(
    async (trimmed) => {
      const payload = buildUpdateProfilePayloadFromBillingForm(profileData, trimmed)
      await updateMyBusinessProfile(payload)
      await refetchProfile()
      await loadLedger()
    },
    [profileData, refetchProfile, loadLedger]
  )

  return {
    hasActivePlan,
    planSubscriptionSummary,
    showPastOrFailedPlan,
    billingAccountSummary,
    ledgerPayments,
    ledgerSubscriptions,
    isLedgerLoading,
    displayRows,
    billingAddressFormDefaults,
    isBillingProfileLoading,
    processingPlanId,
    handleChoosePlan,
    handleBillingAddressSave,
    isAvailablePlansModalOpen,
    isCompareFeaturesModalOpen,
    handleOpenAvailablePlansModal: () => setIsAvailablePlansModalOpen(true),
    handleCloseAvailablePlansModal: () => setIsAvailablePlansModalOpen(false),
    handleOpenCompareFeaturesModal: () => setIsCompareFeaturesModalOpen(true),
    handleCloseCompareFeaturesModal: () => setIsCompareFeaturesModalOpen(false)
  }
}
