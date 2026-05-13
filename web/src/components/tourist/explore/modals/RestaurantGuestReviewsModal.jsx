import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiStar, FiX } from 'react-icons/fi'
import { fetchPublicBusinessRestaurantReviews } from '../../../../services/tourist/touristExplore.service.js'

const formatRating = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return num.toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const formatReviewDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const StarRow = ({ rating }) => {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)))
  return (
    <span className="inline-flex gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          className={`h-3.5 w-3.5 shrink-0 ${i <= r ? 'fill-[#f59f0b] text-[#f59f0b]' : 'text-[#dedede]'}`}
          aria-hidden
        />
      ))}
    </span>
  )
}

/**
 * Render only when visible; parent should unmount on close so filters reset naturally.
 * @param {{ onClose: () => void, businessId: string, businessName?: string }} props
 */
const RestaurantGuestReviewsModal = ({ onClose, businessId, businessName = 'Restaurant' }) => {
  const [sort, setSort] = useState('newest')
  const [ratingFilter, setRatingFilter] = useState('')
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ averageRating: null, reviewCount: 0 })
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const fetchPage = useCallback(
    async ({ nextPage, append }) => {
      const id = String(businessId || '').trim()
      if (!id) return
      const params = {
        sort,
        page: nextPage,
        limit: 20
      }
      if (ratingFilter !== '') {
        const n = Number(ratingFilter)
        if (Number.isFinite(n)) params.rating = n
      }
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const res = await fetchPublicBusinessRestaurantReviews(id, params)
        const data = res?.data?.data
        const list = Array.isArray(data?.reviews) ? data.reviews : []
        const nextSummary = data?.summary || { averageRating: null, reviewCount: 0 }
        setSummary(nextSummary)
        setTotal(Number(data?.total) || 0)
        setLimit(Number(data?.limit) || 20)
        setReviews((prev) => (append ? [...prev, ...list] : list))
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Could not load reviews.')
        if (!append) setReviews([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [businessId, sort, ratingFilter]
  )

  useEffect(() => {
    void fetchPage({ nextPage: 1, append: false })
  }, [businessId, sort, ratingFilter, fetchPage])

  const loadMore = () => {
    if (loadingMore || loading) return
    if (reviews.length >= total) return
    const pageSize = limit > 0 ? limit : 20
    const nextPage = Math.floor(reviews.length / pageSize) + 1
    void fetchPage({ nextPage, append: true })
  }

  const hasMore = useMemo(() => reviews.length < total, [reviews.length, total])

  const avgLabel = formatRating(summary.averageRating)
  const countLabel = Number(summary.reviewCount) || 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restaurant-reviews-modal-title"
    >
      <button type="button" aria-label="Close reviews" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#efefef] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="restaurant-reviews-modal-title" className="text-lg font-semibold text-[#1f1f1f]">
              Customer reviews
            </h2>
            <p className="mt-0.5 truncate text-xs text-[#666]">{businessName}</p>
            <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs text-[#444]">
              <span className="inline-flex items-center gap-1 font-medium text-[#1f1f1f]">
                <FiStar className="h-3.5 w-3.5 text-[#f59f0b]" aria-hidden />
                {countLabel > 0 ? (
                  <>
                    {avgLabel} average · {countLabel} review{countLabel === 1 ? '' : 's'}
                  </>
                ) : (
                  <>No reviews yet</>
                )}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#333] transition hover:bg-[#f5f5f5]"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-[#efefef] px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium text-[#555]">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-md border border-[#e0e0e0] bg-white px-2 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#222]"
              >
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium text-[#555]">
              Stars
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="rounded-md border border-[#e0e0e0] bg-white px-2 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#222]"
              >
                <option value="">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {loading && reviews.length === 0 ? (
            <ul className="list-none space-y-3 p-0">
              {[1, 2, 3].map((k) => (
                <li key={k} className="animate-pulse rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-4">
                  <div className="h-4 w-1/3 rounded bg-[#e8e8e8]" />
                  <div className="mt-3 h-3 w-24 rounded bg-[#e8e8e8]" />
                  <div className="mt-3 h-12 w-full rounded bg-[#e8e8e8]" />
                </li>
              ))}
            </ul>
          ) : null}

          {loading && reviews.length > 0 ? (
            <p className="mb-3 text-center text-xs text-[#888]">Updating list…</p>
          ) : null}

          {error && !loading ? (
            <p className="rounded-lg border border-[#fecdca] bg-[#fff4f2] px-3 py-2 text-sm text-[#7a271a]">{error}</p>
          ) : null}

          {!loading && !error && !reviews.length ? (
            <p className="py-8 text-center text-sm text-[#666]">
              {ratingFilter !== '' && countLabel > 0
                ? 'No reviews match this filter.'
                : 'No reviews yet for this restaurant.'}
            </p>
          ) : null}

          {reviews.length > 0 ? (
            <ul className="list-none space-y-3 p-0">
              {reviews.map((r) => (
                <li key={String(r.id)} className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#e8e8e8] bg-[#eee]">
                      {r.avatarUrl ? (
                        <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#888]">
                          {(r.authorLabel || 'G').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1f1f1f]">{String(r.authorLabel || 'Guest')}</span>
                        <StarRow rating={r.rating} />
                      </div>
                      {r.comment ? (
                        <p className="mt-2 text-sm leading-relaxed text-[#3d3d3d]">&ldquo;{String(r.comment)}&rdquo;</p>
                      ) : (
                        <p className="mt-2 text-xs italic text-[#888]">No written feedback.</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#888]">
                        {r.createdAt ? <span>{formatReviewDate(r.createdAt)}</span> : null}
                        {r.orderCode ? <span>Order {String(r.orderCode)}</span> : null}
                        {r.orderPlacedAt ? <span>Placed {formatReviewDate(r.orderPlacedAt)}</span> : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {hasMore && reviews.length > 0 ? (
            <div className="mt-4 flex justify-center pb-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-medium text-[#262626] transition hover:bg-[#fafafa] disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default RestaurantGuestReviewsModal
