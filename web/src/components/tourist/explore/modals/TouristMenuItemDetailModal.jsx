import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { touristCartHref } from '../../../layout/tourist/touristLayout.constants.js'
import { FiChevronLeft, FiChevronRight, FiMinus, FiPlus } from 'react-icons/fi'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock.hook.js'
import { fetchPublicBusinessById } from '../../../../services/tourist/touristExplore.service.js'
import { hasValidMapCoordinates } from '../../../../shared/utils/mapboxStaticMap.utils.js'
import { useTouristCartItemStore } from '../../../../store/tourist/tourist-cart-item.store.js'
import {
  isTouristCartStayListing,
  pickCartItemDetailsFromMenuItem
} from '../../../../shared/utils/tourist-cart-item-details.utils.js'
import TouristDestinationMapPanel from './TouristDestinationMapPanel.jsx'

const formatPricePhp = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const clampModalQty = (n) => Math.min(99, Math.max(1, Math.round(Number(n)) || 1))

const TouristMenuItemDetailModal = ({ item, onClose, editCartKey = null }) => {
  useBodyScrollLock(Boolean(item))
  const navigate = useNavigate()
  const addItem = useTouristCartItemStore((s) => s.addItem)
  const updateItem = useTouristCartItemStore((s) => s.updateItem)
  const isEditing = Boolean(editCartKey)
  const [business, setBusiness] = useState(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [businessError, setBusinessError] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroTouchStartX = useRef(null)

  const galleryImages = useMemo(() => {
    const list = Array.isArray(item?.images) ? item.images : []
    return list.filter((u) => typeof u === 'string' && String(u).trim())
  }, [item?.images])

  useEffect(() => {
    const initial = Number(item?._initialCartQty)
    setModalQty(isEditing && Number.isFinite(initial) && initial >= 1 ? clampModalQty(initial) : 1)
    setHeroIndex(0)
  }, [item?.businessId, item?.id, editCartKey, isEditing, item?._initialCartQty])

  useEffect(() => {
    if (!item?.businessId) return
    let cancelled = false
    setBusinessLoading(true)
    setBusinessError(null)
    void fetchPublicBusinessById(String(item.businessId))
      .then((res) => {
        if (cancelled) return
        const d = res?.data?.data
        setBusiness(d && typeof d === 'object' ? d : null)
      })
      .catch((err) => {
        if (!cancelled) {
          setBusinessError(err?.response?.data?.message || err?.message || 'Could not load restaurant details.')
          setBusiness(null)
        }
      })
      .finally(() => {
        if (!cancelled) setBusinessLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [item?.businessId])

  const currentHeroSrc = galleryImages.length
    ? galleryImages[Math.min(heroIndex, Math.max(0, galleryImages.length - 1))]
    : null
  const showHeroCarousel = galleryImages.length > 1

  const goHeroPrev = useCallback(() => {
    setHeroIndex((i) => (i <= 0 ? galleryImages.length - 1 : i - 1))
  }, [galleryImages.length])

  const goHeroNext = useCallback(() => {
    setHeroIndex((i) => (i >= galleryImages.length - 1 ? 0 : i + 1))
  }, [galleryImages.length])

  const cartPayload = useCallback(() => {
    if (!item) return null
    const safeIdx = galleryImages.length
      ? Math.min(heroIndex, Math.max(0, galleryImages.length - 1))
      : 0
    const img =
      galleryImages.length > 0
        ? galleryImages[safeIdx]
        : Array.isArray(item.images) && item.images.length
          ? String(item.images[0]).trim()
          : ''
    const listingType = String(item?.listingType || '').trim().toUpperCase()
    return {
      businessId: String(item.businessId),
      businessName: item.businessName,
      catalogItemId: String(item.id),
      name: item.name,
      unitPrice: Number(item.price) || 0,
      image: img,
      qty: clampModalQty(modalQty),
      ...(listingType ? { listingType } : {}),
      ...pickCartItemDetailsFromMenuItem(item)
    }
  }, [item, modalQty, galleryImages, heroIndex])

  if (!item) return null

  const loc = business?.businessLocation
  const destination =
    hasValidMapCoordinates(loc) ? { lat: loc.lat, lng: loc.lng } : null
  const showAvailable = Boolean(item.isAvailable) && item.stockStatus !== 'OUT_OF_STOCK'
  const showQtyControls = showAvailable && !isTouristCartStayListing(item)

  const handleAddToCart = () => {
    const payload = cartPayload()
    if (!payload) return
    if (isEditing) {
      updateItem(String(editCartKey), payload)
      onClose?.()
      navigate(touristCartHref)
      return
    }
    addItem(payload)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tourist-menu-item-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Dismiss dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[95vh] w-full max-w-xl flex-col overflow-x-hidden overflow-y-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#fbf9f6] [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <div
            className="relative h-44 shrink-0 sm:h-52"
            onTouchStart={(e) => {
              if (!showHeroCarousel) return
              heroTouchStartX.current = e.targetTouches[0]?.clientX ?? null
            }}
            onTouchEnd={(e) => {
              if (!showHeroCarousel || heroTouchStartX.current == null) return
              const endX = e.changedTouches[0]?.clientX
              if (typeof endX !== 'number') {
                heroTouchStartX.current = null
                return
              }
              const dx = endX - heroTouchStartX.current
              if (dx < -48) goHeroNext()
              else if (dx > 48) goHeroPrev()
              heroTouchStartX.current = null
            }}
          >
            {currentHeroSrc ? (
              <img
                key={currentHeroSrc}
                src={currentHeroSrc}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#ece3d9] text-sm font-medium text-[#a79a8b]">
                No photo
              </div>
            )}
            {showHeroCarousel ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goHeroPrev()
                  }}
                  className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="Previous photo"
                >
                  <FiChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goHeroNext()
                  }}
                  className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="Next photo"
                >
                  <FiChevronRight className="h-5 w-5" aria-hidden />
                </button>
                <div
                  className="absolute bottom-17 left-0 right-0 z-20 flex justify-center gap-1.5 sm:bottom-18"
                  role="tablist"
                  aria-label="Photo thumbnails"
                >
                  {galleryImages.map((_, idx) => (
                    <button
                      key={String(idx)}
                      type="button"
                      role="tab"
                      aria-selected={idx === heroIndex}
                      aria-label={`Photo ${idx + 1} of ${galleryImages.length}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setHeroIndex(idx)
                      }}
                      className={`h-1.5 rounded-full transition-all ${idx === heroIndex ? 'w-5' : 'w-1.5 bg-white/70 hover:bg-white'}`}
                      style={idx === heroIndex ? { backgroundColor: '#ff7a1a' } : undefined}
                    />
                  ))}
                </div>
              </>
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
            {showAvailable ? (
              <span className="absolute right-3 top-3 z-10 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Available
              </span>
            ) : null}
            <div className="pointer-events-none absolute bottom-3 left-4 right-4 text-white">
              {item.category ? (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">{item.category}</p>
              ) : null}
              <h2 id="tourist-menu-item-title" className="mt-0.5 text-xl font-semibold leading-tight sm:text-2xl">
                {item.name}
              </h2>
              <p className="mt-1 text-sm text-white/90">{item.businessName}</p>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
          <p className="text-2xl font-semibold text-[#ff7a1a]">{formatPricePhp(item.price)}</p>
          {item.description ? (
            <p className="text-sm leading-relaxed text-[#4f4f4f]">{item.description}</p>
          ) : null}
          {item.flavor ? (
            <p className="text-sm text-[#4f4f4f]">
              <span className="font-medium text-[#1f1f1f]">Flavor: </span>
              {item.flavor}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#4f4f4f]">
            {item.preparationTime ? (
              <p>
                <span className="font-medium text-[#1f1f1f]">Prep: </span>
                {item.preparationTime}
              </p>
            ) : null}
            {item.servingSize ? (
              <p>
                <span className="font-medium text-[#1f1f1f]">Serving: </span>
                {item.servingSize}
              </p>
            ) : null}
            {item.spiceLevel && item.spiceLevel !== 'No Spice' ? (
              <p>
                <span className="font-medium text-[#1f1f1f]">Spice: </span>
                {item.spiceLevel}
              </p>
            ) : null}
          </div>
          {item.allergens ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              <span className="font-semibold">Allergens: </span>
              {item.allergens}
            </p>
          ) : null}

          {businessLoading ? (
            <p className="mt-3 text-xs text-[#5b5b5b]">Loading restaurant contact…</p>
          ) : null}
          {businessError ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {businessError}
            </p>
          ) : null}
          {!businessLoading && business?.address ? (
            <p className="mt-3 text-sm text-[#4f4f4f]">
              <span className="font-medium text-[#1f1f1f]">Pickup / venue: </span>
              {business.address}
            </p>
          ) : null}
          {!businessLoading && business?.contact_info?.phone ? (
            <p className="mt-3 text-sm text-[#4f4f4f]">
              <span className="font-medium text-[#1f1f1f]">Phone: </span>
              {business.contact_info.phone}
            </p>
          ) : null}

          <p className="mt-4 text-xs text-[#6b6b6b]">
            Listed by a verified restaurant on Tara Bisita. The map at the end of this listing may ask your browser for
            location to estimate driving time.
          </p>

          <div className="mt-6" aria-label="Map and directions">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Map &amp; directions</p>
            <div className="mt-3 flex w-full justify-center rounded-xl border border-[#e7dfd5] bg-[#faf8f5] p-4">
              <TouristDestinationMapPanel
                key={`${item.businessId}-${item.id}`}
                placeLabel={item.businessName || business?.name || 'Restaurant'}
                address={business?.address}
                destination={destination}
                requireEngagementStep={false}
                compact
                staticMapHeightClass="h-40 w-full sm:h-44"
              />
            </div>
          </div>
          </div>
        </div>

        <div
          className={`flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 border-t border-[#efe6dc] bg-[#faf8f5] px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3 ${showQtyControls ? 'justify-between' : 'justify-end'}`}
        >
          {showQtyControls ? (
            <div className="flex min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span
                className="shrink-0 text-[9px] font-semibold uppercase leading-none tracking-wide text-[#a79a8b] sm:text-[10px]"
                id="menu-item-qty-label"
              >
                Qty
              </span>
              <div className="flex h-9 shrink-0 items-stretch rounded-md border border-[#e7dfd5] bg-white shadow-sm">
                <button
                  type="button"
                  aria-label={`Decrease quantity (now ${modalQty})`}
                  disabled={modalQty <= 1}
                  onClick={() => setModalQty((q) => clampModalQty(q - 1))}
                  className="flex w-8 shrink-0 items-center justify-center rounded-l-md text-[#1f1f1f] transition hover:bg-[#f8f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiMinus className="h-4 w-4" aria-hidden />
                </button>
                <span
                  id="menu-item-qty-value"
                  className="flex min-w-8.5 select-none items-center justify-center border-x border-[#e7dfd5] bg-white px-1.5 text-sm font-semibold tabular-nums leading-none text-[#1f1f1f]"
                  aria-live="polite"
                  aria-atomic="true"
                  title={`Quantity for ${item.name}`}
                >
                  {modalQty}
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity (now ${modalQty})`}
                  disabled={modalQty >= 99}
                  onClick={() => setModalQty((q) => clampModalQty(q + 1))}
                  className="flex w-8 shrink-0 items-center justify-center rounded-r-md text-[#1f1f1f] transition hover:bg-[#f8f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiPlus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex shrink-0 items-center gap-2">
            {showAvailable ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-3 text-xs font-semibold leading-tight text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a] sm:px-3.5 sm:text-[13px]"
              >
                {isEditing ? 'Update cart' : 'Add to cart'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#ff7a1a] px-4 text-xs font-semibold leading-tight text-white transition hover:bg-[#eb6c12] sm:px-4 sm:text-[13px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TouristMenuItemDetailModal
