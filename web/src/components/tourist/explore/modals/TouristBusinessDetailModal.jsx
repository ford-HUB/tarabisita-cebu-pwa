import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi'
import { toast } from 'sonner'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock.hook.js'
import { fetchPublicBusinessById } from '../../../../services/tourist/touristExplore.service.js'
import { categoryDisplayLabel, categoryMatchesLabel } from '../../../../shared/utils/touristExplore.utils.js'
import { pickCartItemDetailsFromMenuItem } from '../../../../shared/utils/tourist-cart-item-details.utils.js'
import { hasValidMapCoordinates } from '../../../../shared/utils/mapboxStaticMap.utils.js'
import { useTouristCartItemStore } from '../../../../store/tourist/tourist-cart-item.store.js'
import { postStoreMessagingLinkToken } from '../../../../services/tourist/store-messaging.service.js'
import { buildTouristStoreMessagingHref } from '../../../layout/tourist/touristLayout.constants'
import TouristDestinationMapPanel from './TouristDestinationMapPanel.jsx'

const heroImg = (business) => business?.banner || business?.coverImage || business?.logo
const DEFAULT_STORE_THEME_COLOR = '#ff7a1a'

const formatPricePhp = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const sanitizeThemeColor = (value, fallback = DEFAULT_STORE_THEME_COLOR) => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return fallback
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : fallback
}

const MenuCategoryChips = ({ categories, selectedKey, onSelect, themeColor }) => {
  if (!categories?.length) return null
  const scrollerRef = useRef(null)

  const scrollChips = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.75)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div
      className="sticky top-0 z-20 border-y border-[#efe6dc]/80 bg-linear-to-b from-white via-white/95 to-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4"
      style={{ borderBottomColor: `${themeColor}28` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a79a8b]">Categories</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollChips(-1)}
          aria-label="Scroll categories left"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e7dfd5] bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          <FiChevronLeft className="h-4 w-4 text-[#1f1f1f]" aria-hidden />
        </button>
        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-0.5 pr-0.5 scroll-smooth [touch-action:pan-x] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
              selectedKey == null
                ? 'border-transparent text-white shadow-md'
                : 'border-[#e7dfd5] bg-white text-[#1f1f1f] hover:border-[#d4c4b6]'
            }`}
            style={
              selectedKey == null
                ? { backgroundColor: themeColor, boxShadow: `0 4px 14px ${themeColor}44` }
                : undefined
            }
          >
            All
          </button>
          {categories.map((cat) => {
            const active = selectedKey === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelect(cat)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-[#e7dfd5] bg-white text-[#1f1f1f] hover:border-[#d4c4b6]'
                }`}
                style={
                  active
                    ? { backgroundColor: themeColor, boxShadow: `0 4px 14px ${themeColor}44` }
                    : undefined
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollChips(1)}
          aria-label="Scroll categories right"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e7dfd5] bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          <FiChevronRight className="h-4 w-4 text-[#1f1f1f]" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const RestaurantMenuPanel = ({
  items,
  menuCategories,
  selectedCategoryKey,
  onSelectCategory,
  isLoading,
  totalPublishedCount,
  businessId,
  businessName,
  onAddToCart,
  themeColor
}) => (
  <div className="overflow-hidden rounded-xl border border-[#efe6dc]" style={{ borderColor: `${themeColor}36`, backgroundColor: `${themeColor}12` }}>
    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Menu</p>
      <p className="mt-1 text-xs text-[#5b5b5b]">In-stock items from this partner. Filter by the categories they use on their menu.</p>
    </div>
    <MenuCategoryChips
      categories={menuCategories}
      selectedKey={selectedCategoryKey}
      onSelect={onSelectCategory}
      themeColor={themeColor}
    />
    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
      {isLoading ? (
        <ul className="mt-1 flex list-none flex-col gap-3 p-0">
          {[0, 1, 2].map((k) => (
            <li key={k} className="animate-pulse rounded-lg bg-[#ece3d9] p-3">
              <div className="h-4 w-2/3 rounded bg-[#dfd5cb]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-[#dfd5cb]" />
            </li>
          ))}
        </ul>
      ) : null}
      {!isLoading && !items?.length ? (
        <p className="mt-3 text-sm text-[#5b5b5b]">
          {!totalPublishedCount
            ? 'No published menu items are listed yet.'
            : 'No items match this filter. Try another category or All.'}
        </p>
      ) : null}
      {!isLoading && items?.length ? (
        <ul className="mt-1 flex list-none flex-col gap-3 p-0">
          {items.map((item) => {
            const img = Array.isArray(item.images) && item.images.length ? item.images[0] : null
            const showAvailable = Boolean(item.isAvailable) && item.stockStatus !== 'OUT_OF_STOCK'
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-[#e7dfd5] bg-white p-2.5 shadow-sm sm:flex-row sm:gap-3"
              >
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-[#ece3d9] sm:h-28 sm:w-28">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                  {showAvailable ? (
                    <span className="absolute left-0.5 top-0.5 rounded bg-emerald-600/95 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                      In stock
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1f1f1f]">{item.name}</p>
                    {showAvailable && businessId && onAddToCart ? (
                      <button
                        type="button"
                        onClick={() =>
                          onAddToCart({
                            businessId: String(businessId),
                            businessName,
                            catalogItemId: String(item.id),
                            name: item.name,
                            unitPrice: Number(item.price) || 0,
                            image: img || '',
                            qty: 1,
                            ...pickCartItemDetailsFromMenuItem(item)
                          })
                        }
                        className="shrink-0 rounded-full border border-[#e7dfd5] px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-80"
                        style={{ borderColor: `${themeColor}40`, color: themeColor }}
                      >
                        Add
                      </button>
                    ) : null}
                  </div>
                  {item.category ? (
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: themeColor }}>
                      {item.category}
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-3 text-xs text-[#5b5b5b]">{item.description}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#6b6b6b]">
                    {item.preparationTime ? <span>Prep: {item.preparationTime}</span> : null}
                    {item.servingSize ? <span>Serves: {item.servingSize}</span> : null}
                    {item.spiceLevel && item.spiceLevel !== 'No Spice' ? <span>Spice: {item.spiceLevel}</span> : null}
                  </div>
                  {item.allergens ? (
                    <p className="mt-1 text-[10px] text-amber-900/90">Allergens: {item.allergens}</p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold" style={{ color: themeColor }}>
                    {formatPricePhp(item.price)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  </div>
)

const TouristBusinessDetailModal = ({ business, onClose }) => {
  useBodyScrollLock(Boolean(business))
  const navigate = useNavigate()
  const addItem = useTouristCartItemStore((s) => s.addItem)
  const [merged, setMerged] = useState(business)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [isOpeningMessage, setIsOpeningMessage] = useState(false)
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(null)

  useEffect(() => {
    setMerged(business)
  }, [business])

  useEffect(() => {
    setSelectedMenuCategory(null)
  }, [business?._id])

  useEffect(() => {
    if (!business?._id) return
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    void fetchPublicBusinessById(String(business._id))
      .then((res) => {
        if (cancelled) return
        const d = res?.data?.data
        if (d && typeof d === 'object') {
          setMerged((prev) => ({ ...prev, ...d }))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.response?.data?.message || err?.message || 'Could not refresh listing details.'
          setDetailError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [business?._id])

  if (!business) return null

  const img = heroImg(merged)
  const label = categoryDisplayLabel(merged.category)
  const isRestaurant = categoryMatchesLabel(merged.category, 'Restaurant')
  const menuItems = Array.isArray(merged.menuItems) ? merged.menuItems : []
  const menuCategories = useMemo(() => {
    const seen = new Set()
    const order = []
    for (const item of menuItems) {
      const raw = typeof item?.category === 'string' ? item.category.trim() : ''
      if (!raw || seen.has(raw)) continue
      seen.add(raw)
      order.push(raw)
    }
    return order
  }, [menuItems])
  const filteredMenuItems = useMemo(() => {
    if (selectedMenuCategory == null) return menuItems
    return menuItems.filter((item) => String(item?.category || '').trim() === selectedMenuCategory)
  }, [menuItems, selectedMenuCategory])
  const themeColor = sanitizeThemeColor(merged.themeColor, DEFAULT_STORE_THEME_COLOR)
  const themeDarkColor = sanitizeThemeColor(merged.themeColor, '#9b5a2c')
  const phone = merged.contact_info?.phone
  const website = merged.website
  const websiteHref =
    website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : ''

  const coords = merged?.businessLocation
  const coordsOk = hasValidMapCoordinates(coords)
  const destination = coordsOk ? { lat: coords.lat, lng: coords.lng } : null
  const logoSrc = merged?.logo || merged?.coverImage || merged?.banner || ''
  const businessName = merged?.name || 'Store'
  const businessInitial = String(businessName || 'S').trim().slice(0, 1).toUpperCase() || 'S'

  const handleOpenMessage = async () => {
    const businessId = merged?._id ? String(merged._id) : ''
    if (!businessId) {
      toast.error('Store details are still loading. Please try again.')
      return
    }
    setIsOpeningMessage(true)
    try {
      const res = await postStoreMessagingLinkToken({ businessId })
      const token = res?.data?.data?.messagingToken
      if (!token) throw new Error('NO_TOKEN')
      navigate(`/${buildTouristStoreMessagingHref(token)}`)
      onClose?.()
    } catch {
      toast.error('Could not open message. Please try again.')
    } finally {
      setIsOpeningMessage(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tourist-business-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-10 flex h-screen w-screen flex-col overflow-hidden border border-[#e7dfd5] bg-white shadow-2xl sm:h-[96vh] sm:w-[96vw] sm:max-w-7xl sm:rounded-3xl"
        style={{ borderColor: `${themeColor}3d` }}
      >
        <div className="relative h-48 shrink-0 lg:h-60">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${themeDarkColor}, ${themeColor})`
              }}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-white/85">{label}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-white/20">
                  {logoSrc ? (
                    <img src={logoSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-white">{businessInitial}</span>
                  )}
                </div>
                <h3 id="tourist-business-title" className="truncate text-xl font-semibold">
                  {businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenMessage}
                disabled={isOpeningMessage}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiMessageCircle className="h-3.5 w-3.5" aria-hidden />
                {isOpeningMessage ? 'Opening…' : 'Message'}
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] p-5 sm:p-6" style={{ backgroundColor: `${themeColor}14` }}>
          <div className="grid gap-5 xl:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.55fr)]">
            <div className="space-y-5">
              <div className="space-y-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: `${themeColor}33`, backgroundColor: `${themeColor}10` }}>
                {merged.description ? (
                  <p className="text-sm leading-relaxed text-[#4f4f4f]">{merged.description}</p>
                ) : null}
                {merged.address ? (
                  <p className="text-sm text-[#4f4f4f]">
                    <span className="font-medium text-[#1f1f1f]">Address: </span>
                    {merged.address}
                  </p>
                ) : null}
                {phone ? (
                  <p className="text-sm text-[#4f4f4f]">
                    <span className="font-medium text-[#1f1f1f]">Phone: </span>
                    {phone}
                  </p>
                ) : null}
                {websiteHref ? (
                  <p className="text-sm">
                    <span className="font-medium text-[#1f1f1f]">Website: </span>
                    <a href={websiteHref} className="underline" style={{ color: themeDarkColor }} target="_blank" rel="noreferrer">
                      {website}
                    </a>
                  </p>
                ) : null}

                {detailError ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    {detailError}
                  </p>
                ) : null}

                <p className="text-xs text-[#6b6b6b]">
                  {isRestaurant
                    ? 'Menu shows items this partner marked available. Travel times use driving estimates and depend on traffic.'
                    : 'Reservations and maps depend on each business. This listing is verified on Tara Bisita.'}
                </p>
              </div>

              <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: `${themeColor}33`, backgroundColor: `${themeColor}10` }}>
                <TouristDestinationMapPanel
                  key={String(merged._id)}
                  placeLabel={merged.name}
                  address={merged.address}
                  destination={destination}
                  requireEngagementStep={false}
                  staticMapHeightClass="h-52 lg:h-64"
                />
              </div>
            </div>

            <div className="min-w-0">
              {isRestaurant ? (
                <RestaurantMenuPanel
                  items={filteredMenuItems}
                  menuCategories={menuCategories}
                  selectedCategoryKey={selectedMenuCategory}
                  onSelectCategory={setSelectedMenuCategory}
                  isLoading={detailLoading && !menuItems.length}
                  totalPublishedCount={menuItems.length}
                  businessId={merged._id}
                  businessName={merged.name}
                  onAddToCart={addItem}
                  themeColor={themeColor}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#efe6dc] px-4 py-3" style={{ borderTopColor: `${themeColor}2b`, backgroundColor: `${themeColor}18` }}>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: themeColor }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TouristBusinessDetailModal
