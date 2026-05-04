import { useEffect, useState } from 'react'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock.hook.js'
import { fetchPublicBusinessById } from '../../../../services/tourist/touristExplore.service.js'
import { categoryDisplayLabel, categoryMatchesLabel } from '../../../../shared/utils/touristExplore.utils.js'
import { pickCartItemDetailsFromMenuItem } from '../../../../shared/utils/tourist-cart-item-details.utils.js'
import { hasValidMapCoordinates } from '../../../../shared/utils/mapboxStaticMap.utils.js'
import { useTouristCartItemStore } from '../../../../store/tourist/tourist-cart-item.store.js'
import TouristDestinationMapPanel from './TouristDestinationMapPanel.jsx'

const heroImg = (business) => business?.banner || business?.coverImage || business?.logo

const formatPricePhp = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const RestaurantMenuPanel = ({ items, isLoading, businessId, businessName, onAddToCart }) => (
  <div className="rounded-xl border border-[#efe6dc] bg-[#fbf9f6] p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Menu highlights</p>
    <p className="mt-1 text-xs text-[#5b5b5b]">Available dishes from this partner (in stock).</p>
    {isLoading ? (
      <ul className="mt-3 space-y-2">
        {[0, 1, 2].map((k) => (
          <li key={k} className="animate-pulse rounded-lg bg-[#ece3d9] p-3">
            <div className="h-4 w-2/3 rounded bg-[#dfd5cb]" />
            <div className="mt-2 h-3 w-1/3 rounded bg-[#dfd5cb]" />
          </li>
        ))}
      </ul>
    ) : null}
    {!isLoading && !items?.length ? (
      <p className="mt-3 text-sm text-[#5b5b5b]">No published menu items are listed yet.</p>
    ) : null}
    {!isLoading && items?.length ? (
      <ul className="mt-3 max-h-52 list-none space-y-2 overflow-y-auto overscroll-contain p-0 [-webkit-overflow-scrolling:touch]">
        {items.map((item) => {
          const img = Array.isArray(item.images) && item.images.length ? item.images[0] : null
          const showAvailable = Boolean(item.isAvailable) && item.stockStatus !== 'OUT_OF_STOCK'
          return (
            <li
              key={item.id}
              className="flex gap-3 rounded-lg border border-[#e7dfd5] bg-white p-2.5 shadow-sm"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#ece3d9]">
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
                      className="shrink-0 rounded-full border border-[#e7dfd5] bg-[#fff8f2] px-2.5 py-1 text-[11px] font-semibold text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a]"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
                {item.category ? (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9b5a2c]">{item.category}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#5b5b5b]">{item.description}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#6b6b6b]">
                  {item.preparationTime ? <span>Prep: {item.preparationTime}</span> : null}
                  {item.servingSize ? <span>Serves: {item.servingSize}</span> : null}
                  {item.spiceLevel && item.spiceLevel !== 'No Spice' ? <span>Spice: {item.spiceLevel}</span> : null}
                </div>
                {item.allergens ? (
                  <p className="mt-1 text-[10px] text-amber-900/90">Allergens: {item.allergens}</p>
                ) : null}
                <p className="mt-1 text-sm font-semibold text-[#ff7a1a]">{formatPricePhp(item.price)}</p>
              </div>
            </li>
          )
        })}
      </ul>
    ) : null}
  </div>
)

const TouristBusinessDetailModal = ({ business, onClose }) => {
  useBodyScrollLock(Boolean(business))
  const addItem = useTouristCartItemStore((s) => s.addItem)
  const [merged, setMerged] = useState(business)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  useEffect(() => {
    setMerged(business)
  }, [business])

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
  const phone = merged.contact_info?.phone
  const website = merged.website
  const websiteHref =
    website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : ''

  const coords = merged?.businessLocation
  const coordsOk = hasValidMapCoordinates(coords)
  const destination = coordsOk ? { lat: coords.lat, lng: coords.lng } : null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tourist-business-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="relative h-40 shrink-0 sm:h-48">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${merged.themeColor || '#9b5a2c'}, #ff7a1a)`
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-white/85">{label}</p>
            <h3 id="tourist-business-title" className="text-xl font-semibold">
              {merged.name}
            </h3>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
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
              <a
                href={websiteHref}
                className="text-[#9b5a2c] underline hover:text-[#ff7a1a]"
                target="_blank"
                rel="noreferrer"
              >
                {website}
              </a>
            </p>
          ) : null}

          {isRestaurant ? (
            <RestaurantMenuPanel
              items={menuItems}
              isLoading={detailLoading && !menuItems.length}
              businessId={merged._id}
              businessName={merged.name}
              onAddToCart={addItem}
            />
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

          <div className="border-t border-[#efe6dc] pt-6">
            <TouristDestinationMapPanel
              key={String(merged._id)}
              placeLabel={merged.name}
              address={merged.address}
              destination={destination}
              requireEngagementStep={false}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-[#efe6dc] bg-[#faf8f5] px-4 py-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#ff7a1a] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
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
