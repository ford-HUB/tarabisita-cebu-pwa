import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiStar } from 'react-icons/fi'
import { categoryDisplayLabel } from '../../../../shared/utils/touristExplore.utils.js'

const thumb = (business) => business?.banner || business?.coverImage || business?.logo

/**
 * @param {{
 *   title: string,
 *   items: unknown[],
 *   onOpen: (business: unknown) => void,
 *   subtitle?: string,
 *   seeAllTo?: string,
 *   seeAllLabel?: string,
 *   seeLessLabel?: string,
 *   previewLimit?: number,
 *   headerAlign?: 'left' | 'center',
 *   fillAvailableWidth?: boolean
 * }} props
 */
const TouristBusinessCarouselSection = ({
  title,
  items,
  onOpen,
  subtitle,
  seeAllTo,
  seeAllLabel = 'See all',
  seeLessLabel = 'Show less',
  previewLimit,
  headerAlign = 'left',
  fillAvailableWidth = false
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!items?.length) return null

  const canExpandInline =
    previewLimit != null && Number.isFinite(previewLimit) && items.length > previewLimit
  const isExpanded = canExpandInline && expanded
  const visibleItems = isExpanded ? items : canExpandInline ? items.slice(0, previewLimit) : items
  const showSeeAllControl = Boolean(seeAllTo || canExpandInline)

  const showHeaderRow = Boolean(subtitle || showSeeAllControl)
  const centered = headerAlign === 'center'
  const gridFillWidth = fillAvailableWidth || isExpanded

  return (
    <section aria-label={title} className="scroll-mt-4">
      {showHeaderRow ? (
        <div
          className={[
            'mb-2.5 flex flex-wrap gap-3 md:mb-3',
            showSeeAllControl ? 'items-end justify-between' : centered ? 'flex-col items-center text-center' : 'items-end justify-between'
          ].join(' ')}
        >
          <div className={['min-w-0', centered && !showSeeAllControl ? 'mx-auto max-w-2xl' : ''].filter(Boolean).join(' ')}>
            <h2
              className={[
                'text-base font-semibold tracking-tight text-[#1f1f1f] md:text-xl',
                centered ? 'text-center' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                className={[
                  'mt-1 max-w-2xl text-sm leading-relaxed text-[#6b5f54]',
                  centered ? 'mx-auto text-center' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {canExpandInline ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={isExpanded}
              className="shrink-0 rounded-full border border-[#eadfce] bg-[#fffaf6] px-3 py-1.5 text-xs font-semibold text-[#9b5a2c] transition hover:border-[#c66b2b]/40 hover:bg-[#fff7ed] md:text-sm"
            >
              {isExpanded ? seeLessLabel : seeAllLabel}
            </button>
          ) : seeAllTo ? (
            <Link
              to={seeAllTo}
              className="shrink-0 rounded-full border border-[#eadfce] bg-[#fffaf6] px-3 py-1.5 text-xs font-semibold text-[#9b5a2c] transition hover:border-[#c66b2b]/40 hover:bg-[#fff7ed] md:text-sm"
            >
              {seeAllLabel}
            </Link>
          ) : null}
        </div>
      ) : (
        <h2
          className={[
            'mb-2.5 text-base font-semibold tracking-tight text-[#1f1f1f] md:mb-3 md:text-xl',
            centered ? 'text-center' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {title}
        </h2>
      )}
      <div
        className={
          'gap-3 pb-2 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-3 ' +
          'max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden ' +
          (gridFillWidth
            ? 'md:grid md:grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] md:gap-4 md:overflow-visible'
            : 'md:grid md:grid-cols-[repeat(auto-fill,minmax(12rem,14rem))] md:justify-start md:gap-4 md:overflow-visible')
        }
      >
        {visibleItems.map((business) => {
          const img = thumb(business)
          const label = categoryDisplayLabel(business.category)
          const sum = business?.restaurantReviewSummary
          const avg = sum?.averageRating != null ? Number(sum.averageRating) : null
          const cnt = Number(sum?.reviewCount || 0)
          const showStars = Number.isFinite(avg) && cnt > 0
          return (
            <button
              key={String(business._id)}
              type="button"
              onClick={() => onOpen(business)}
              className={
                'group relative max-md:w-44 max-md:max-w-[min(85vw,13.5rem)] max-md:snap-start max-md:shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#1a120c] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:min-w-0 md:w-full ' +
                (gridFillWidth ? 'md:max-w-none' : 'md:max-w-56')
              }
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {img ? (
                  <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(160deg, ${business.themeColor || '#9b5a2c'}, #3d2918)`
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#ffd4bc]">{label}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{business.name}</p>
                  {showStars ? (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-100/95">
                      <FiStar className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                      <span>
                        {avg.toFixed(1)} · {cnt} review{cnt === 1 ? '' : 's'}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default TouristBusinessCarouselSection
