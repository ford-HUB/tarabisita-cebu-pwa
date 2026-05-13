import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from './useAuth.hook'
import { touristCheckoutFormSchema } from '../shared/validators/touristCheckout.validator.js'
import { TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS } from '../components/tourist/checkout/touristBillingPaymentOptions.jsx'
import { fetchPublicBusinessById } from '../services/tourist/touristExplore.service.js'
import { groupCartItemsByBusiness, useTouristCartItemStore } from '../store/tourist/tourist-cart-item.store.js'
import { getTouristMenuOrderCheckoutStatus, postTouristCustomerOrderCheckout } from '../services/tourist/touristCustomerOrder.service.js'
import { putTouristCartItems } from '../services/tourist/tourist-cart-item.service.js'
import {
  touristCartHref,
  touristCheckoutHref,
  touristExploreHref,
  touristHistoryHref,
  touristStayBookingHref
} from '../components/layout/tourist/touristLayout.constants.js'
import { categoryMatchesLabel } from '../shared/utils/touristExplore.utils.js'
import {
  assignXenditCheckout,
  isLikelySocialInAppBrowser,
  isTrustedXenditCheckoutUrl
} from '../shared/utils/xenditCheckoutRedirect.utils.js'

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

const distinctBusinessIds = (list) => [...new Set((list || []).map((it) => String(it.businessId || '')).filter(Boolean))]

/**
 * @param {{ variant?: 'cart' | 'checkout' }} [options]
 * - `cart`: full saved cart (grouped by restaurant). Clears checkout scope on mount.
 * - `checkout`: only rows for the active checkout restaurant (or implicit single-store cart).
 */
export const useTouristRestaurantCheckout = (options = {}) => {
  const variant = options.variant === 'checkout' ? 'checkout' : 'cart'
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [xenditInAppCheckoutUrl, setXenditInAppCheckoutUrl] = useState(null)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD'])
  const [isProceedingFromCart, setIsProceedingFromCart] = useState(false)
  const proceedFromCartLockRef = useRef(false)

  const {
    items: storeItems,
    activeCheckoutBusinessId,
    deselectedItemKeys,
    setItemQty,
    setItemNotes,
    removeItem,
    removeItemsForBusiness,
    toggleItemSelected,
    setActiveCheckoutBusinessId,
    clearActiveCheckoutBusinessId,
    rehydrateActiveCheckoutBusinessIdFromStorage
  } = useTouristCartItemStore(
    useShallow((s) => ({
      items: s.items,
      activeCheckoutBusinessId: s.activeCheckoutBusinessId,
      deselectedItemKeys: s.deselectedItemKeys,
      setItemQty: s.setItemQty,
      setItemNotes: s.setItemNotes,
      removeItem: s.removeItem,
      removeItemsForBusiness: s.removeItemsForBusiness,
      toggleItemSelected: s.toggleItemSelected,
      setActiveCheckoutBusinessId: s.setActiveCheckoutBusinessId,
      clearActiveCheckoutBusinessId: s.clearActiveCheckoutBusinessId,
      rehydrateActiveCheckoutBusinessIdFromStorage: s.rehydrateActiveCheckoutBusinessIdFromStorage
    }))
  )

  useEffect(() => {
    if (variant === 'cart') {
      clearActiveCheckoutBusinessId()
    } else {
      rehydrateActiveCheckoutBusinessIdFromStorage()
    }
  }, [variant, clearActiveCheckoutBusinessId, rehydrateActiveCheckoutBusinessIdFromStorage])

  const storeDistinctIds = useMemo(() => distinctBusinessIds(storeItems), [storeItems])

  const implicitSingleBusinessId = useMemo(
    () => (storeDistinctIds.length === 1 ? storeDistinctIds[0] : null),
    [storeDistinctIds]
  )

  const effectiveCheckoutBusinessId = useMemo(() => {
    if (activeCheckoutBusinessId) return String(activeCheckoutBusinessId)
    if (implicitSingleBusinessId) return implicitSingleBusinessId
    return null
  }, [activeCheckoutBusinessId, implicitSingleBusinessId])

  /** Checkout route: multiple restaurants saved and user did not start checkout from one store. */
  const checkoutBlockedMultiStore = useMemo(
    () => variant === 'checkout' && storeDistinctIds.length > 1 && !activeCheckoutBusinessId,
    [variant, storeDistinctIds.length, activeCheckoutBusinessId]
  )

  const checkoutWorkingItems = useMemo(() => {
    if (variant === 'cart') return storeItems
    if (checkoutBlockedMultiStore) return []
    if (effectiveCheckoutBusinessId) {
      return storeItems.filter((it) => String(it.businessId) === String(effectiveCheckoutBusinessId))
    }
    return storeItems
  }, [variant, storeItems, checkoutBlockedMultiStore, effectiveCheckoutBusinessId])

  const otherStoresSummary = useMemo(() => {
    if (variant !== 'checkout' || !effectiveCheckoutBusinessId) {
      return { count: 0, rowCount: 0, total: 0 }
    }
    const others = storeItems.filter((it) => String(it.businessId) !== String(effectiveCheckoutBusinessId))
    const rowCount = others.length
    const count = others.reduce((n, it) => n + (Number(it.qty) || 0), 0)
    const total = others.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), 0)
    return { count, rowCount, total }
  }, [variant, storeItems, effectiveCheckoutBusinessId])

  const groups = useMemo(() => groupCartItemsByBusiness(checkoutWorkingItems), [checkoutWorkingItems])

  const isItemSelected = useCallback((key) => !deselectedItemKeys[key], [deselectedItemKeys])

  const selectedItems = useMemo(
    () => checkoutWorkingItems.filter((it) => isItemSelected(it.key)),
    [checkoutWorkingItems, isItemSelected]
  )

  const groupsForCheckout = useMemo(() => groupCartItemsByBusiness(selectedItems), [selectedItems])

  const selectedSpansMultipleStores = useMemo(() => {
    const ids = new Set(
      selectedItems.map((it) => String(it.businessId || '').trim()).filter(Boolean)
    )
    return ids.size > 1
  }, [selectedItems])

  const cartTotal = useMemo(
    () => checkoutWorkingItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * it.qty, 0),
    [checkoutWorkingItems]
  )

  const fullStoreCartTotal = useMemo(
    () => storeItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * it.qty, 0),
    [storeItems]
  )

  const selectedItemRowCount = selectedItems.length
  const selectedBusinessId =
    groupsForCheckout.length === 1 && groupsForCheckout[0]?.businessId
      ? String(groupsForCheckout[0].businessId)
      : ''

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

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!selectedBusinessId) {
        setAvailablePaymentMethods(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD'])
        return
      }
      try {
        const res = await fetchPublicBusinessById(selectedBusinessId)
        if (!active) return
        const methods = Array.isArray(res?.data?.data?.availablePaymentMethods)
          ? res.data.data.availablePaymentMethods
          : ['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']
        setAvailablePaymentMethods(methods)
      } catch {
        if (!active) return
        setAvailablePaymentMethods(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD'])
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [selectedBusinessId])

  useEffect(() => {
    const current = String(form.getValues('billingType') || '')
    if (availablePaymentMethods.includes(current)) return
    const fallback = availablePaymentMethods[0]
    if (fallback) {
      form.setValue('billingType', fallback, { shouldValidate: true, shouldDirty: true })
    }
  }, [availablePaymentMethods, form])

  const billingPaymentOptions = useMemo(
    () =>
      TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS.map((option) => ({
        ...option,
        disabled: !availablePaymentMethods.includes(option.value)
      })),
    [availablePaymentMethods]
  )
  const hasAvailablePaymentOptions = availablePaymentMethods.length > 0

  const billingMethodLabel = useMemo(() => {
    const opt = TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS.find((o) => o.value === billingTypeWatch)
    return opt?.label || 'Online payment'
  }, [billingTypeWatch])

  const clearXenditReturnParams = useCallback(() => {
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
      clearXenditReturnParams()
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
          clearActiveCheckoutBusinessId()
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
          clearXenditReturnParams()
          const joiner = touristHistoryHref.includes('?') ? '&' : '?'
          const orderId = encodeURIComponent(String(data.order.id || '').trim())
          const bid = encodeURIComponent(String(data.businessId || '').trim())
          const storeName = encodeURIComponent(String(data.order.businessName || 'Restaurant').trim())
          navigate(`${touristHistoryHref}${joiner}reviewOrder=${orderId}&reviewBusiness=${bid}&reviewStore=${storeName}`)
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
        clearXenditReturnParams()
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
  }, [searchParams, clearXenditReturnParams, navigate, removeItemsForBusiness, clearActiveCheckoutBusinessId])

  const closeXenditInAppCheckoutModal = useCallback(() => {
    setXenditInAppCheckoutUrl(null)
  }, [])

  const continueXenditInAppCheckout = useCallback(() => {
    if (!xenditInAppCheckoutUrl) return
    try {
      assignXenditCheckout(xenditInAppCheckoutUrl)
    } catch {
      toast.error('That payment link is not valid. Please try again.')
      setXenditInAppCheckoutUrl(null)
    }
  }, [xenditInAppCheckoutUrl])

  const resolveScopedSelectedList = useCallback(() => {
    const st = useTouristCartItemStore.getState()
    const all = st.items
    const ids = distinctBusinessIds(all)
    const implicit = ids.length === 1 ? ids[0] : null
    const scope = st.activeCheckoutBusinessId || implicit
    const selectedList = all.filter((it) => st.isItemSelected(it.key))
    if (scope) {
      return selectedList.filter((it) => String(it.businessId) === String(scope))
    }
    return selectedList
  }, [])

  const placeOrders = form.handleSubmit(async (values) => {
    const scopedSelected = resolveScopedSelectedList()
    const batches = groupCartItemsByBusiness(scopedSelected).filter((g) => g.items.length)
    if (!batches.length) {
      toast.error('Select at least one item to check out.')
      return
    }
    if (batches.length > 1) {
      toast.error(
        'Online prepayment supports one restaurant per checkout. Open your cart, select items from one store, then use Proceed to checkout.'
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
      if (!checkoutUrl || !isTrustedXenditCheckoutUrl(checkoutUrl)) {
        toast.error(res?.data?.message || 'Invalid payment session link.')
        return
      }
      if (isLikelySocialInAppBrowser()) {
        setXenditInAppCheckoutUrl(checkoutUrl)
        return
      }
      assignXenditCheckout(checkoutUrl)
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

  /** Restaurant prepayment checkout vs. stay booking details (resort/hotel), based on the selected store. */
  const proceedFromCart = useCallback(async () => {
    if (proceedFromCartLockRef.current) return
    const st = useTouristCartItemStore.getState()
    const selectedList = st.items.filter((it) => st.isItemSelected(it.key))
    if (!selectedList.length) {
      toast.error('Select at least one item to check out.')
      return
    }
    const batches = groupCartItemsByBusiness(selectedList).filter((g) => g.items.length)
    if (batches.length > 1) {
      toast.error('Select items from one restaurant only, then tap Proceed to checkout.')
      return
    }
    const batch = batches[0]
    proceedFromCartLockRef.current = true
    setIsProceedingFromCart(true)
    try {
      const res = await fetchPublicBusinessById(String(batch.businessId))
      const d = res?.data?.data
      if (!d || typeof d !== 'object') {
        toast.error('Could not load this business. Try again.')
        return
      }
      const isStayBusiness =
        categoryMatchesLabel(d.category, 'Resort') || categoryMatchesLabel(d.category, 'Hotel')
      if (isStayBusiness) {
        clearActiveCheckoutBusinessId()
        const ids = new Set(batch.items.map((it) => String(it.catalogItemId)))
        if (ids.size !== 1) {
          toast.error('Select one stay package at a time to continue to booking details.')
          return
        }
        const catalogItemId = [...ids][0]
        const menuItems = Array.isArray(d.menuItems) ? d.menuItems : []
        const found = menuItems.find((it) => String(it?.id) === catalogItemId)
        if (!found) {
          toast.error('This stay package is no longer available.')
          return
        }
        navigate(touristStayBookingHref, {
          state: {
            stayPackage: {
              ...found,
              businessId: String(batch.businessId),
              businessName: batch.items[0]?.businessName || d.name
            },
            stayBusiness: {
              _id: String(d._id || batch.businessId),
              name: d.name,
              addOns: d.addOns
            }
          }
        })
        return
      }
      setActiveCheckoutBusinessId(String(batch.businessId))
      navigate(touristCheckoutHref)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not continue. Try again.'
      toast.error(msg)
    } finally {
      proceedFromCartLockRef.current = false
      setIsProceedingFromCart(false)
    }
  }, [navigate, setActiveCheckoutBusinessId, clearActiveCheckoutBusinessId])

  return {
    variant,
    items: checkoutWorkingItems,
    storeItems,
    groups,
    groupsForCheckout,
    cartTotal,
    fullStoreCartTotal,
    selectedItemRowCount,
    selectedCount,
    selectedTotal,
    billingMethodLabel,
    formatPhp,
    billingPaymentOptions,
    hasAvailablePaymentOptions,
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
    proceedFromCart,
    isProceedingFromCart,
    selectedSpansMultipleStores,
    checkoutBlockedMultiStore,
    effectiveCheckoutBusinessId,
    otherStoresSummary,
    multiStoreInSavedCart: storeDistinctIds.length > 1,
    isXenditMobileCheckoutModalOpen: Boolean(xenditInAppCheckoutUrl),
    xenditMobileCheckoutUrl: xenditInAppCheckoutUrl || '',
    closeXenditMobileCheckoutModal: closeXenditInAppCheckoutModal,
    continueXenditMobileCheckout: continueXenditInAppCheckout
  }
}
