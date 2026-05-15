import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FiCoffee,
  FiSun,
  FiFlag,
  FiShoppingBag,
  FiMoon,
  FiStar,
  FiExternalLink,
  FiCompass
} from 'react-icons/fi'
import { CEBU_CURATED_SPOTS_BY_VIBE, CEBU_VIBE_CATEGORIES, mapsUrlForQuery } from '../../../shared/constants/cebuVibeDiscovery.constants.js'
import { categoryDisplayLabel } from '../../../shared/utils/touristExplore.utils.js'
import { filterBusinessesByVibeId } from '../../../shared/utils/touristVibeDiscovery.utils.js'

const MotionDiv = motion.div
const MotionP = motion.p

const iconFor = (id) => {
  switch (id) {
    case 'restaurant':
      return FiCoffee
    case 'beach':
      return FiSun
    case 'heritage':
      return FiFlag
    case 'market':
      return FiShoppingBag
    case 'nightlife':
      return FiMoon
    default:
      return FiCompass
  }
}

const thumb = (business) => business?.banner || business?.coverImage || business?.logo

const resultsCarouselClass =
  'flex gap-4 overflow-x-auto pb-1 pt-0.5 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory [scrollbar-width:thin] md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:snap-none lg:grid-cols-3'

const carouselCardClass =
  'min-w-[min(100%,19.5rem)] max-w-[19.5rem] shrink-0 snap-start sm:min-w-[17.5rem] md:min-w-0 md:max-w-none md:shrink'

/**
 * @param {{
 *   businesses?: unknown[],
 *   partnersLoading?: boolean,
 *   onOpenPartner?: (business: unknown) => void,
 *   activeVibe?: string | null,
 *   onActiveVibeChange?: (next: string | null) => void
 * }} props
 */
const TouristVibeDiscoverySection = ({
  businesses = [],
  partnersLoading = false,
  onOpenPartner,
  activeVibe: activeVibeProp,
  onActiveVibeChange
}) => {
  const [uncontrolledVibe, setUncontrolledVibe] = useState(null)
  const controlled = typeof onActiveVibeChange === 'function'
  const activeVibe = controlled ? activeVibeProp ?? null : uncontrolledVibe

  const toggleVibe = (id) => {
    if (controlled) {
      onActiveVibeChange(activeVibe === id ? null : id)
    } else {
      setUncontrolledVibe((prev) => (prev === id ? null : id))
    }
  }

  const partners = useMemo(
    () => (activeVibe ? filterBusinessesByVibeId(activeVibe, businesses) : []),
    [activeVibe, businesses]
  )

  const curated = useMemo(
    () => (activeVibe ? CEBU_CURATED_SPOTS_BY_VIBE[activeVibe] || [] : []),
    [activeVibe]
  )

  const showPartnerSkeleton = Boolean(activeVibe && partnersLoading && !partners.length)

  return (
    <section id="vibe-discovery" className="scroll-mt-24 rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm md:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1f1f1f] md:text-3xl">
          What&apos;s your vibe today?
        </h2>
        <p className="mt-2 text-sm text-[#6b5f54] md:text-base">
          Find exactly what you&apos;re looking for in Cebu.
        </p>
        {activeVibe ? (
          <button
            type="button"
            onClick={() => {
              if (controlled) onActiveVibeChange?.(null)
              else setUncontrolledVibe(null)
            }}
            className="mt-4 text-xs font-semibold text-[#c66b2b] underline-offset-4 transition hover:text-[#a65821] hover:underline"
          >
            Clear selection
          </button>
        ) : null}
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CEBU_VIBE_CATEGORIES.map((cat) => {
          const Icon = iconFor(cat.id)
          const selected = activeVibe === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleVibe(cat.id)}
              className={[
                'group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border px-3 py-4 text-center transition duration-200 md:py-5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                'active:scale-[0.98]',
                selected
                  ? 'border-[#ff7a1a] bg-[#fff7ed] shadow-md ring-2 ring-[#ff7a1a]/40'
                  : 'border-[#e7dfd5] bg-[#fcfaf7] hover:-translate-y-0.5 hover:border-[#d4c4b6] hover:shadow-md'
              ].join(' ')}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${cat.gradient} text-white shadow-sm transition group-hover:scale-105 md:h-14 md:w-14`}
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
              </div>
              <span className="text-xs font-semibold text-[#1f1f1f] md:text-sm">{cat.label}</span>
              <span className="hidden text-[10px] leading-snug text-[#7a6e62] sm:block">{cat.blurb}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeVibe ? (
          <MotionDiv
            key={activeVibe}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="mt-10 space-y-10"
          >
            {(partners.length > 0 || showPartnerSkeleton) ? (
              <div>
                <h3 className="mb-1 text-lg font-semibold text-[#1f1f1f]">Partners on Tara Bisita</h3>
                <p className="mb-4 text-sm text-[#6b5f54]">
                  {showPartnerSkeleton
                    ? 'Loading verified partners for this vibe…'
                    : 'Verified businesses that match your vibe—open a profile to order or book.'}
                </p>
                <div className={resultsCarouselClass}>
                  {showPartnerSkeleton
                    ? [0, 1, 2].map((i) => (
                        <div
                          key={`sk-${i}`}
                          className={`${carouselCardClass} flex flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f8f5f0]`}
                        >
                          <div className="aspect-[16/10] animate-pulse bg-[#ece3d9]" />
                          <div className="space-y-2 p-3">
                            <div className="h-2.5 w-1/3 animate-pulse rounded-md bg-[#e4dcd4]" />
                            <div className="h-4 w-4/5 max-w-[12rem] animate-pulse rounded-md bg-[#e4dcd4]" />
                            <div className="h-2.5 w-1/2 animate-pulse rounded-md bg-[#ebe4dc]" />
                          </div>
                        </div>
                      ))
                    : partners.map((business) => {
                        const img = thumb(business)
                        const label = categoryDisplayLabel(business.category)
                        return (
                          <button
                            key={String(business._id)}
                            type="button"
                            onClick={() => onOpenPartner?.(business)}
                            className={`${carouselCardClass} group flex flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] text-left shadow-sm transition hover:border-[#c66b2b]/50 hover:shadow-md`}
                          >
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ece3d9]">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div
                                  className="flex h-full w-full items-center justify-center text-xs text-[#a79a8b]"
                                  style={{
                                    background: `linear-gradient(160deg, ${business.themeColor || '#9b5a2c'}, #3d2918)`
                                  }}
                                >
                                  No photo
                                </div>
                              )}
                              <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                                Partner
                              </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-1 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9b5a2c]">{label}</p>
                              <p className="line-clamp-2 text-sm font-semibold text-[#1f1f1f]">{business.name}</p>
                              {business.publicProfileViewCount ? (
                                <p className="text-[11px] text-[#7a6e62]">
                                  {Number(business.publicProfileViewCount).toLocaleString()} profile views
                                </p>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                </div>
              </div>
            ) : null}

            {curated.length ? (
              <div>
                <h3 className="mb-1 text-lg font-semibold text-[#1f1f1f]">Popular in Cebu</h3>
                <p className="mb-4 text-sm text-[#6b5f54]">
                  Editorial picks to inspire your itinerary—open Maps for directions.
                </p>
                <div className={resultsCarouselClass}>
                  {curated.map((spot) => (
                    <article
                      key={spot.id}
                      className={`${carouselCardClass} flex flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-white shadow-sm transition hover:border-[#d4c4b6] hover:shadow-md`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ece3d9]">
                        <img
                          src={spot.image}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-amber-200 backdrop-blur-sm">
                          <FiStar className="h-3.5 w-3.5" aria-hidden />
                          {spot.rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <div>
                          <h4 className="text-sm font-semibold text-[#1f1f1f]">{spot.name}</h4>
                          <p className="text-xs text-[#9b5a2c]">{spot.area}</p>
                        </div>
                        <p className="line-clamp-3 text-xs leading-relaxed text-[#5b534c]">{spot.description}</p>
                        <div className="mt-auto flex flex-wrap gap-1.5">
                          {spot.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-[#f5eee4] px-2 py-0.5 text-[10px] font-medium text-[#7a5c3a]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <a
                          href={mapsUrlForQuery(`${spot.name} ${spot.area} Cebu`)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#c66b2b] hover:text-[#a65821]"
                        >
                          Open in Maps
                          <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {!partners.length && !curated.length && !showPartnerSkeleton ? (
              <p className="rounded-xl border border-dashed border-[#e7dfd5] bg-[#fcfaf7] p-6 text-center text-sm text-[#6b5f54]">
                No curated picks for this vibe yet. Try another category or browse all partners.
              </p>
            ) : null}
          </MotionDiv>
        ) : (
          <MotionP
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-sm text-[#8a7f72]"
          >
            Tap a vibe to see Tara Bisita partners and Cebu highlights side by side.
            
          </MotionP>
        )}
        
      </AnimatePresence>
      
    </section>
  )
}

export default TouristVibeDiscoverySection
