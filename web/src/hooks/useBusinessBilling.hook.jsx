import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import {
  subscriptionEffectiveStatusLabels,
  subscriptionPlanIdLabels
} from '../components/business/billing/constants/billing.constants'
import {
  BILLING_PAYMENT_TOAST_DURATION_SECONDS,
  billingPaymentReturnToastConfig
} from '../shared/constants/billing.constants'
import { formatBillingDateTime, formatBillingPeso } from '../shared/utils/billingDisplay.utils'
import { useBusinessBillingProfile } from './useBusinessBillingProfile.hook'
import { useBillingStore } from '../store/billing/billing.store'
import {
  assignXenditCheckout,
  isLikelySocialInAppBrowser,
  isTrustedXenditCheckoutUrl
} from '../shared/utils/xenditCheckoutRedirect.utils'

/**
 * Billing page controller: profile rows, checkout, billing-address save, plan modals, payment return UX.
 * Mirrors the Profile page pattern (thin page + dedicated hook).
 */
export const useBusinessBilling = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [processingPlanId, setProcessingPlanId] = useState(null)
  const [isAvailablePlansModalOpen, setIsAvailablePlansModalOpen] = useState(false)
  const [isCompareFeaturesModalOpen, setIsCompareFeaturesModalOpen] = useState(false)
  const [xenditInAppCheckoutUrl, setXenditInAppCheckoutUrl] = useState(null)

  const { ledgerPayments, ledgerSubscriptions, monthlyCapacity, isLedgerLoading } = useBillingStore(
    useShallow((s) => ({
      ledgerPayments: s.ledgerPayments,
      ledgerSubscriptions: s.ledgerSubscriptions,
      monthlyCapacity: s.monthlyCapacity,
      isLedgerLoading: s.isLedgerLoading
    }))
  )

  const {
    profileData,
    displayRows,
    billingAddressFormDefaults,
    isLoading: isBillingProfileLoading,
    refetchProfile
  } = useBusinessBillingProfile()

  const loadLedger = useCallback(async () => {
    await useBillingStore.getState().loadLedger()
  }, [])

  useEffect(() => {
    const store = useBillingStore.getState()
    void store.loadBillingAccountProfile()
    void store.loadLedger()
  }, [])

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

  const isPlanSelectionLocked = Boolean(
    profileData?.subscription?.planChangeLocked ?? hasActivePlan
  )

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

  const closeXenditInAppCheckoutModal = useCallback(() => {
    setXenditInAppCheckoutUrl(null)
  }, [])

  const continueXenditInAppCheckout = useCallback(() => {
    if (!xenditInAppCheckoutUrl) {
      return
    }
    try {
      assignXenditCheckout(xenditInAppCheckoutUrl)
    } catch {
      toast.error('That payment link is not valid. Please try choosing a plan again.')
      setXenditInAppCheckoutUrl(null)
    }
  }, [xenditInAppCheckoutUrl])

  const handleChoosePlan = useCallback(async (plan) => {
    if (isPlanSelectionLocked) {
      toast.error(
        'Your current prepaid plan is still active. You can choose a new billing cycle after the current period ends.'
      )
      return
    }
    try {
      setProcessingPlanId(plan.id)
      const checkoutUrl = await useBillingStore.getState().createBillingCheckout({
        months: plan.months,
        returnBaseUrl: window.location.origin
      })
      if (!isTrustedXenditCheckoutUrl(checkoutUrl)) {
        toast.error('Invalid payment session link. Please try again or contact support.')
        setProcessingPlanId(null)
        return
      }
      if (isLikelySocialInAppBrowser()) {
        setXenditInAppCheckoutUrl(checkoutUrl)
        setProcessingPlanId(null)
        return
      }
      assignXenditCheckout(checkoutUrl)
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to start Xendit checkout.')
      setProcessingPlanId(null)
    }
  }, [isPlanSelectionLocked])

  const handleBillingAddressSave = useCallback(async (trimmed) => {
    await useBillingStore.getState().saveBillingAddressFromForm(trimmed)
  }, [])

  return {
    hasActivePlan,
    isPlanSelectionLocked,
    planSubscriptionSummary,
    showPastOrFailedPlan,
    billingAccountSummary,
    monthlyCapacity,
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
    handleCloseCompareFeaturesModal: () => setIsCompareFeaturesModalOpen(false),
    isXenditMobileCheckoutModalOpen: Boolean(xenditInAppCheckoutUrl),
    xenditMobileCheckoutUrl: xenditInAppCheckoutUrl || '',
    closeXenditMobileCheckoutModal: closeXenditInAppCheckoutModal,
    continueXenditMobileCheckout: continueXenditInAppCheckout
  }
}
