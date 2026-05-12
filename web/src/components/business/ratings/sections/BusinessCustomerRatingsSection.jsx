import { FiStar } from 'react-icons/fi'

const SENTIMENT_META = {
  good: {
    label: 'Good',
    badgeClass: 'border-[#b7e4c7] bg-[#ecfdf3] text-[#027a48]'
  },
  bad: {
    label: 'Needs attention',
    badgeClass: 'border-[#fecdca] bg-[#fff4f2] text-[#b42318]'
  },
  neutral: {
    label: 'Okay',
    badgeClass: 'border-[#eadfce] bg-[#fffdf9] text-[#6d645d]'
  }
}

const formatRating = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(1).replace(/\.0$/, '')
}

const formatDateTime = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

const StarRow = ({ rating }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0))
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < value
        return (
          <FiStar
            key={index}
            size={14}
            className={filled ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#d8cfc4]'}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/**
 * @param {{
 *   summary: Record<string, unknown> | null,
 *   items: Record<string, unknown>[],
 *   pagination: Record<string, unknown> | null,
 *   supported: boolean,
 *   sentiment: string,
 *   page: number,
 *   isLoading: boolean,
 *   errorMessage: string,
 *   onSentimentChange: (value: string) => void,
 *   onPageChange: (value: number) => void
 * }} props
 */
const BusinessCustomerRatingsSection = ({
  summary,
  items,
  pagination,
  supported,
  sentiment,
  page,
  isLoading,
  errorMessage,
  onSentimentChange,
  onPageChange
}) => {
  const filters = [
    { id: 'all', label: 'All reviews', count: summary?.reviewCount },
    { id: 'good', label: 'Good', count: summary?.goodCount },
    { id: 'bad', label: 'Needs attention', count: summary?.badCount }
  ]

  const totalPages = Number(pagination?.totalPages || 0)
  const currentPage = Number(pagination?.page || page || 1)

  return (
    <>
      {errorMessage ? (
        <p className="rounded-xl border border-[#fecdca] bg-[#fff4f2] px-3 py-2 text-sm text-[#7a271a]">{errorMessage}</p>
      ) : null}

      {!supported ? (
        <div className="rounded-xl border border-dashed border-[#e7dfd5] bg-[#fcfaf7] px-4 py-12 text-center">
          <p className="text-sm font-medium text-[#4a433c]">Customer ratings are not available for this business type yet.</p>
          <p className="mt-1 text-xs text-[#8a8179]">Restaurant guest reviews will appear here once that feature is enabled for your category.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <p className="text-xs text-[#8a8179]">Average rating</p>
              <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">
                {summary?.reviewCount ? `${formatRating(summary.averageRating)} / 5` : 'No ratings yet'}
              </p>
            </article>
            <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <p className="text-xs text-[#8a8179]">Total reviews</p>
              <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{Number(summary?.reviewCount || 0)}</p>
            </article>
            <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <p className="text-xs text-[#8a8179]">Good reviews</p>
              <p className="mt-1 text-lg font-semibold text-[#027a48]">{Number(summary?.goodCount || 0)}</p>
            </article>
            <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <p className="text-xs text-[#8a8179]">Needs attention</p>
              <p className="mt-1 text-lg font-semibold text-[#b42318]">{Number(summary?.badCount || 0)}</p>
            </article>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = sentiment === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onSentimentChange(filter.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'border-[#d4b08a] bg-[#f2e8da] text-[#9b5a2c]'
                      : 'border-[#eadfce] bg-white text-[#6d645d] hover:bg-[#f7f3ed]'
                  }`}
                >
                  {filter.label}
                  <span className="ml-1 text-xs text-[#8a8179]">({Number(filter.count || 0)})</span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 space-y-3">
            {isLoading && !items.length ? (
              <p className="py-8 text-center text-sm text-[#8a8179]">Loading customer ratings…</p>
            ) : null}

            {!isLoading && !items.length && !errorMessage ? (
              <div className="rounded-xl border border-dashed border-[#e7dfd5] bg-[#fcfaf7] px-4 py-12 text-center">
                <p className="text-sm font-medium text-[#4a433c]">No customer ratings yet</p>
                <p className="mt-1 text-xs text-[#8a8179]">
                  {sentiment === 'all'
                    ? 'Guest reviews from completed prepaid orders will show up here.'
                    : 'Try another filter to see more reviews.'}
                </p>
              </div>
            ) : null}

            {items.map((item) => {
              const meta = SENTIMENT_META[item.sentiment] || SENTIMENT_META.neutral
              const comment = String(item.comment || '').trim()
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] px-4 py-4 shadow-[0_1px_4px_rgba(88,62,41,0.06)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2f2f2f]">{item.authorLabel || 'Verified diner'}</p>
                      <p className="mt-1 text-xs text-[#8a8179]">{formatDateTime(item.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="rounded-full border border-[#eadfce] bg-white px-2.5 py-1 text-xs font-semibold text-[#6d645d]">
                        {item.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <StarRow rating={item.rating} />
                  </div>

                  {comment ? (
                    <p className="mt-3 text-sm leading-relaxed text-[#4a4037]">{comment}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-[#a79a8b]">No written comment.</p>
                  )}
                </article>
              )
            })}
          </div>

          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
                className="rounded-lg border border-[#eadfce] px-3 py-2 text-sm font-semibold text-[#6d645d] transition enabled:hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-xs text-[#8a8179]">
                Page {currentPage} of {totalPages}
              </p>
              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => onPageChange(currentPage + 1)}
                className="rounded-lg border border-[#eadfce] px-3 py-2 text-sm font-semibold text-[#6d645d] transition enabled:hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}

export default BusinessCustomerRatingsSection
