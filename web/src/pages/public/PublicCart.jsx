import { useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import TouristCheckoutCartSection from '../../components/tourist/checkout/sections/TouristCheckoutCartSection.jsx'
import { TOURIST_CART_EDIT_KEY_STORAGE, touristCheckoutHref } from '../../components/layout/tourist/touristLayout.constants.js'
import { buildPublicBusinessEditCartHref } from '../../shared/constants/publicCatalog.constants.js'
import { setGuestCartCheckoutPending } from '../../shared/utils/guestCartStorage.utils.js'
import { groupCartItemsByBusiness } from '../../store/tourist/tourist-cart-item.store.js'
import { useGuestCartStore } from '../../store/guest/guest-cart.store.js'

const formatPhp = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '₱0.00'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PublicCart = () => {
  const navigate = useNavigate()
  const { items, deselectedItemKeys, setItemQty, removeItem, toggleItemSelected } = useGuestCartStore(
    useShallow((s) => ({
      items: s.items,
      deselectedItemKeys: s.deselectedItemKeys,
      setItemQty: s.setItemQty,
      removeItem: s.removeItem,
      toggleItemSelected: s.toggleItemSelected
    }))
  )

  const isItemSelected = useCallback((key) => !deselectedItemKeys[String(key)], [deselectedItemKeys])

  const groups = useMemo(() => groupCartItemsByBusiness(items), [items])

  const selectedItems = useMemo(
    () => items.filter((it) => isItemSelected(it.key)),
    [items, isItemSelected]
  )

  const selectedCount = useMemo(() => selectedItems.reduce((n, it) => n + it.qty, 0), [selectedItems])

  const selectedSpansMultipleStores = useMemo(() => {
    const ids = new Set(selectedItems.map((it) => String(it.businessId || '').trim()).filter(Boolean))
    return ids.size > 1
  }, [selectedItems])

  const multiStoreInSavedCart = useMemo(() => {
    const ids = new Set(items.map((it) => String(it.businessId || '').trim()).filter(Boolean))
    return ids.size > 1
  }, [items])

  const handleCheckout = () => {
    if (!selectedItems.length) return
    if (selectedSpansMultipleStores) return
    setGuestCartCheckoutPending()
    const next = encodeURIComponent(touristCheckoutHref)
    navigate(`/login?next=${next}`)
  }

  const editCartItem = useCallback(
    (item) => {
      const businessId = String(item?.businessId || '').trim()
      const catalogItemId = String(item?.catalogItemId || '').trim()
      if (!businessId || !catalogItemId) {
        toast.error('This item cannot be edited right now.')
        return
      }
      try {
        sessionStorage.setItem(TOURIST_CART_EDIT_KEY_STORAGE, String(item.key))
      } catch {
        /* ignore */
      }
      navigate(buildPublicBusinessEditCartHref(businessId, catalogItemId, item.key))
    },
    [navigate]
  )

  if (!groups.length) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] transition hover:text-[#c66b2b]"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <div className="mt-8 rounded-2xl border border-[#e7dfd5] bg-white p-8 text-center shadow-sm md:p-10">
          <h1 className="text-lg font-semibold text-[#1f1f1f]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[#5b5b5b]">Search from the home page and add dishes or packages to get started.</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
          >
            Explore Tara Bisita
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10 pb-12 md:py-12">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] transition hover:text-[#c66b2b]"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-[#1f1f1f] md:text-2xl">Your cart</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          Sign in to complete checkout. Your selections are saved on this device until you log in.
        </p>
        {multiStoreInSavedCart ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#7a4e12]">
            Items from more than one partner are saved. Checkout one restaurant at a time after you sign in.
          </p>
        ) : null}
      </div>

      <TouristCheckoutCartSection
        groups={groups}
        formatPhp={formatPhp}
        setItemQty={setItemQty}
        removeItem={removeItem}
        isItemSelected={isItemSelected}
        toggleItemSelected={toggleItemSelected}
        onEditItem={editCartItem}
      />

      <div className="space-y-2 border-t border-[#f0e8de] pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/search"
            className="w-full rounded-full border border-[#e7dfd5] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#1f1f1f] transition hover:border-[#d4c4b6] sm:w-auto"
          >
            Continue shopping
          </Link>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedSpansMultipleStores}
              title={
                selectedSpansMultipleStores
                  ? 'Select items from one restaurant only — checkout is one store at a time.'
                  : undefined
              }
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1f1f1f] px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Sign in to checkout
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-[#ece3d9] px-6 py-2.5 text-center text-sm font-semibold text-[#6b6b6b] sm:w-auto"
            >
              Select at least one item
            </button>
          )}
        </div>
        {selectedCount > 0 && selectedSpansMultipleStores ? (
          <p className="text-right text-xs text-[#7a4e12] sm:text-sm">
            Uncheck items from other restaurants to continue — checkout is one partner at a time.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default PublicCart
