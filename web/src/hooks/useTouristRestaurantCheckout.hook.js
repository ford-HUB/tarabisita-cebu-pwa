import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from './useAuth.hook'
import { touristCheckoutFormSchema } from '../shared/validators/touristCheckout.validator.js'
import { TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS } from '../components/tourist/checkout/touristBillingPaymentOptions.jsx'
import { groupCartItemsByBusiness, useTouristCartItemStore } from '../store/tourist/tourist-cart-item.store.js'
import { getTouristMenuOrderCheckoutStatus, postTouristCustomerOrderCheckout } from '../services/tourist/touristCustomerOrder.service.js'
import { putTouristCartItems } from '../services/tourist/tourist-cart-item.service.js'
import { touristCartHref, touristExploreHref } from '../components/layout/tourist/touristLayout.constants.js'
import { assignPaymongoCheckout, isLikelySocialInAppBrowser, isTrustedPaymongoCheckoutUrl } from '../shared/utils/paymongoCheckoutRedirect.utils.js'

const formatPhp = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '₱0.00'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const POLL_MS = 2000
const POLL_MAX_ATTEMPTS = 24
const stripItemKeyForApi = (item) => {
  const { key: _k, ...rest } = item
  return rest
}

export const useTouristRestaurantCheckout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [paymongoInAppCheckoutUrl, setPaymongoInAppCheckoutUrl] = useState(null)

  const {
    items,
    deselectedItemKeys,
    groupByBusiness,
    setItemQty,
    setItemNotes,
    removeItem,
    removeItemsForBusiness,
    toggleItemSelected
  } = useTouristCartItemStore(
    useShallow((s) => ({
      items: s.items,
      deselectedItemKeys: s.deselectedItemKeys,
      groupByBusiness: s.groupByBusiness,
      setItemQty: s.setItemQty,
      setItemNotes: s.setItemNotes,
      removeItem: s.removeItem,
      removeItemsForBusiness: s.removeItemsForBusiness,
      toggleItemSelected: s.toggleItemSelected
    }))
  )

  const groups = useMemo(() => groupByBusiness(), [items, groupByBusiness])

  const isItemSelected = useCallback((key) => !deselectedItemKeys[key], [deselectedItemKeys])

  const selectedItems = useMemo(
    () => items.filter((it) => isItemSelected(it.key)),
    [items, isItemSelected]
  )

  const groupsForCheckout = useMemo(() => groupCartItemsByBusiness(selectedItems), [selectedItems])

  const cartTotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * it.qty, 0),
    [items]
  )

  const selectedItemRowCount = selectedItems.length

  const selectedCount = useMemo(() => selectedItems.reduce((n, it) => n + it.qty, 0), [selectedItems])

  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * it.qty, 0),
    [selectedItems]
  )

  const form = useForm({
    resolver: zodResolver(touristCheckoutFormSchema),
    defaultValues: {
      customerName: user?.name?.trim() || '',
      customerPhone: '',
      billingType: 'GCASH',
      notes: ''
    }
  })

  useEffect(() => {
    const n = user?.name?.trim()
    if (n && !form.getValues('customerName')) {
      form.setValue('customerName', n)
    }
  }, [user?.name, form])

  const billingTypeWatch = useWatch({ control: form.control, name: 'billingType' })

  const billingMethodLabel = useMemo(() => {
    const opt = TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS.find((o) => o.value === billingTypeWatch)
    return opt?.label || 'Online payment'
  }, [billingTypeWatch])

  const clearPaymongoReturnParams = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    next.delete('pending')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const payment = searchParams.get('payment')
    const pending = searchParams.get('pending')
    if (!payment || !pending) {
      return undefined
    }

    if (payment === 'cancelled') {
      toast.message('Payment was cancelled.')
      clearPaymongoReturnParams()
      return undefined
    }

    if (payment !== 'success') {
      return undefined
    }

    let attempts = 0
    let timerId
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      attempts += 1
      try {
        const res = await getTouristMenuOrderCheckoutStatus(pending)
        const data = res?.data?.data
        if (data?.status === 'PAID' && data?.order && data?.businessId) {
          removeItemsForBusiness(data.businessId)
          try {
            const st = useTouristCartItemStore.getState()
            await putTouristCartItems({
              items: st.items.map(stripItemKeyForApi),
              deselectedItemKeys: st.deselectedItemKeys
            })
          } catch {
            /* background cart sync hook will retry later */
          }
          toast.success(`Order placed — ${data.order.productName || 'Your order'}`)
          clearPaymongoReturnParams()
          navigate(touristExploreHref)
          return
        }
      } catch {
        /* keep polling briefly */
      }
      if (cancelled) return
      if (attempts >= POLL_MAX_ATTEMPTS) {
        toast.error(
          'Payment may still be processing. Check your Orders page in a moment, or contact support if you were charged but see no order.'
        )
        clearPaymongoReturnParams()
        return
      }
      timerId = window.setTimeout(poll, POLL_MS)
    }

    toast.message('Confirming payment…', { description: 'This usually takes a few seconds.' })
    void poll()

    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [searchParams, clearPaymongoReturnParams, navigate, removeItemsForBusiness])

  const closePaymongoInAppCheckoutModal = useCallback(() => {
    setPaymongoInAppCheckoutUrl(null)
  }, [])

  const continuePaymongoInAppCheckout = useCallback(() => {
    if (!paymongoInAppCheckoutUrl) return
    try {
      assignPaymongoCheckout(paymongoInAppCheckoutUrl)
    } catch {
      toast.error('That payment link is not valid. Please try again.')
      setPaymongoInAppCheckoutUrl(null)
    }
  }, [paymongoInAppCheckoutUrl])

  const placeOrders = form.handleSubmit(async (values) => {
    const st = useTouristCartItemStore.getState()
    const selectedList = st.items.filter((it) => st.isItemSelected(it.key))
    const batches = groupCartItemsByBusiness(selectedList).filter((g) => g.items.length)
    if (!batches.length) {
      toast.error('Select at least one item to check out.')
      return
    }
    if (batches.length > 1) {
      toast.error(
        'Online prepayment supports one restaurant per checkout. Remove items from other stores, pay for this one, then repeat for the next.'
      )
      return
    }

    const g = batches[0]
    const payloadBase = {
      customerName: values.customerName.trim(),
      customerPhone: (values.customerPhone || '').trim(),
      billingType: values.billingType,
      notes: (values.notes || '').trim(),
      lines: g.items.map((it) => ({
        menuItemId: it.catalogItemId,
        quantity: it.qty,
        notes: (it.itemNotes || '').trim()
      })),
      returnBaseUrl: typeof window !== 'undefined' ? window.location.origin : undefined
    }

    try {
      const res = await postTouristCustomerOrderCheckout(g.businessId, payloadBase)
      const checkoutUrl = res?.data?.data?.checkoutUrl
      if (!checkoutUrl || !isTrustedPaymongoCheckoutUrl(checkoutUrl)) {
        toast.error(res?.data?.message || 'Invalid payment session link.')
        return
      }
      if (isLikelySocialInAppBrowser()) {
        setPaymongoInAppCheckoutUrl(checkoutUrl)
        return
      }
      assignPaymongoCheckout(checkoutUrl)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not start payment.'
      toast.error(msg)
    }
  })

  const goExplore = useCallback(() => {
    navigate(touristExploreHref)
  }, [navigate])

  const goCart = useCallback(() => {
    navigate(touristCartHref)
  }, [navigate])

  return {
    items,
    groups,
    groupsForCheckout,
    cartTotal,
    selectedItemRowCount,
    selectedCount,
    selectedTotal,
    billingMethodLabel,
    formatPhp,
    billingPaymentOptions: TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS,
    form,
    placeOrders,
    isSubmitting: form.formState.isSubmitting,
    setItemQty,
    setItemNotes,
    removeItem,
    isItemSelected,
    toggleItemSelected,
    goExplore,
    goCart,
    isPaymongoMobileCheckoutModalOpen: Boolean(paymongoInAppCheckoutUrl),
    paymongoMobileCheckoutUrl: paymongoInAppCheckoutUrl || '',
    closePaymongoMobileCheckoutModal: closePaymongoInAppCheckoutModal,
    continuePaymongoMobileCheckout: continuePaymongoInAppCheckout
  }
}
