import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import TouristDestinationMapPanel from './TouristDestinationMapPanel.jsx'
import { fetchPublicBusinessById } from '../../../../services/tourist/touristExplore.service.js'
import { hasValidMapCoordinates } from '../../../../shared/utils/mapboxStaticMap.utils.js'

const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TouristStayPackageDetailModal = ({ open, item, onClose, onAddToCart, onBookNow }) => {
  const [imageIndex, setImageIndex] = useState(0)
  const [businessDetail, setBusinessDetail] = useState(null)
  const [businessDetailLoading, setBusinessDetailLoading] = useState(false)
  const [businessDetailError, setBusinessDetailError] = useState('')

  useEffect(() => {
    setImageIndex(0)
  }, [item?.id])

  useEffect(() => {
    if (!open) return
    const businessId = String(item?.businessId || '').trim()
    if (!businessId) {
      setBusinessDetail(null)
      setBusinessDetailError('')
      return
    }
    let cancelled = false
    setBusinessDetailLoading(true)
    setBusinessDetailError('')
    void fetchPublicBusinessById(businessId)
      .then((res) => {
        if (cancelled) return
        const data = res?.data?.data
        setBusinessDetail(data && typeof data === 'object' ? data : null)
      })
      .catch((err) => {
        if (cancelled) return
        setBusinessDetail(null)
        setBusinessDetailError(err?.response?.data?.message || err?.message || 'Could not load resort location.')
      })
      .finally(() => {
        if (!cancelled) setBusinessDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, item?.businessId])

  if (!open || !item) return null

  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : []
  const image = images[imageIndex] || images[0] || ''
  const showAvailable = Boolean(item.isAvailable) && String(item.stockStatus || '').trim().toUpperCase() !== 'OUT_OF_STOCK'
  const amenitiesText = String(item?.amenities || item?.amities || item?.allergens || '').trim()
  const destination = hasValidMapCoordinates(businessDetail?.businessLocation)
    ? { lat: businessDetail.businessLocation.lat, lng: businessDetail.businessLocation.lng }
    : null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-xl flex-col overflow-x-hidden overflow-y-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbf9f6]">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-[#ece3d9]">
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-black/60"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-black/60"
                  aria-label="Next image"
                >
                  <FiChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <div className="absolute bottom-16 left-0 right-0 z-10 flex justify-center gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      type="button"
                      aria-label={`Show image ${idx + 1}`}
                      onClick={() => setImageIndex(idx)}
                      className={`h-1.5 rounded-full ${idx === imageIndex ? 'w-5 bg-[#ff7a1a]' : 'w-1.5 bg-white/80'}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/85">{item.category || 'Stay package'}</p>
              <h3 className="mt-1 text-2xl font-semibold leading-tight">{item.name}</h3>
              <p className="text-sm text-white/90">{item.businessName || 'Resort'}</p>
            </div>
            <span
              className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm ${
                showAvailable ? 'bg-emerald-600/95' : 'bg-rose-600/95'
              }`}
            >
              {showAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="space-y-3 px-5 py-4">
            <p className="text-2xl font-semibold text-[#ff7a1a]">{formatPrice(item.price)}</p>
            {item.description ? <p className="text-sm leading-relaxed text-[#4f4f4f]">{item.description}</p> : null}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#4f4f4f]">
              {item.preparationTime ? (
                <p>
                  <span className="font-medium text-[#1f1f1f]">Confirmation: </span>
                  {item.preparationTime}
                </p>
              ) : null}
              {item.servingSize ? (
                <p>
                  <span className="font-medium text-[#1f1f1f]">Capacity: </span>
                  {item.servingSize}
                </p>
              ) : null}
              {amenitiesText ? (
                <p>
                  <span className="font-medium text-[#1f1f1f]">Amenities: </span>
                  {amenitiesText}
                </p>
              ) : null}
            </div>
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Map &amp; directions</p>
              <div className="mt-2 rounded-xl border border-[#e7dfd5] bg-[#faf8f5] p-3">
                <TouristDestinationMapPanel
                  placeLabel={item.businessName || businessDetail?.name || 'Resort'}
                  address={businessDetail?.address}
                  destination={destination}
                  requireEngagementStep={false}
                  compact
                  staticMapHeightClass="h-40 w-full sm:h-44"
                />
              </div>
              {businessDetailLoading ? <p className="mt-2 text-xs text-[#666]">Loading resort location…</p> : null}
              {businessDetailError ? <p className="mt-2 text-xs text-[#b42318]">{businessDetailError}</p> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#efe6dc] bg-[#faf8f5] px-4 py-3">
          {onAddToCart ? (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!showAvailable}
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 text-xs font-semibold text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[13px]"
            >
              Add to cart
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBookNow}
            disabled={!showAvailable}
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#ff7a1a] px-4 text-xs font-semibold text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[13px]"
          >
            Book now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#e7dfd5] bg-white px-4 text-xs font-semibold text-[#5b5b5b] transition hover:border-[#d4c4b6] sm:text-[13px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TouristStayPackageDetailModal
