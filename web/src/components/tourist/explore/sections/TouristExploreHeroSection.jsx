import { useCallback, useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { categoryDisplayLabel, categoryMatchesLabel } from '../../../../shared/utils/touristExplore.utils.js'

const cardImage = (business) => business?.banner || business?.coverImage || business?.logo || null

const AUTOPLAY_MS = 7500

const HERO_CAROUSEL_NAV_BTN_CLASS =
  'rounded-full border border-white/25 bg-black/35 p-2 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/50 sm:p-2.5'

const HeroSlide = ({ business, userName, onOpen, padForDots }) => {
  const img = cardImage(business)
  const label = categoryDisplayLabel(business.category)
  const isRestaurant = categoryMatchesLabel(business?.category, 'Restaurant')

  return (
    <div className="relative min-w-full shrink-0">
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a120c] via-[#1a120c]/55 to-transparent" />
      {img ? (
        <img src={img} alt="" className="h-60 w-full object-cover sm:h-64 md:h-72 lg:h-80 xl:h-[22rem]" loading="lazy" />
      ) : (
        <div
          className="h-60 w-full sm:h-64 md:h-72 lg:h-80 xl:h-[22rem]"
          style={{
            background: `linear-gradient(135deg, ${business.themeColor || '#9b5a2c'} 0%, #ff7a1a 100%)`
          }}
        />
      )}
      <div
        className={`absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-6 md:p-8${padForDots ? ' pb-14 sm:pb-16' : ''}`}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-white/80">Spotlight partner</p>
        <h2 className="mt-1 max-w-none text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
          Hello, {userName.trim().split(' ')[0]}! Start with {business.name}
        </h2>
        <p className="mt-2 line-clamp-2 max-w-none text-sm leading-relaxed text-white/90 md:text-base">
          {business.description || 'Verified partner — open the card to order, book, or see what they offer.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">{label}</span>
          <button
            type="button"
            onClick={() => onOpen(business)}
            className="rounded-full bg-[#ff7a1a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12]"
          >
            {isRestaurant ? 'Visit & Order' : 'View & Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TouristExploreHeroSection = ({ userName, businesses, onOpen }) => {
  const slides = Array.isArray(businesses) ? businesses.filter(Boolean) : []
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  useEffect(() => {
    setIndex(0)
  }, [businesses])

  const go = useCallback(
    (delta) => {
      if (count < 2) return
      setIndex((i) => (i + delta + count) % count)
    },
    [count]
  )

  useEffect(() => {
    if (count < 2 || paused) return
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (!count) return null

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[#e7dfd5] shadow-md"
      aria-roledescription="carousel"
      aria-label="Spotlight partners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        touchStartX.current = null
        if (start == null || count < 2) return
        const end = e.changedTouches[0]?.clientX
        if (end == null) return
        const dx = start - end
        if (dx > 48) go(1)
        else if (dx < -48) go(-1)
      }}
    >
      <span className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}
      </span>
      <div className="overflow-hidden">
        <div
          className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {slides.map((business) => (
            <HeroSlide
              key={String(business._id)}
              business={business}
              userName={userName}
              onOpen={onOpen}
              padForDots={count > 1}
            />
          ))}
        </div>
      </div>

      {count > 1 ? (
        <>
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-5rem)] -translate-x-1/2 flex-wrap justify-center gap-1.5 sm:bottom-5">
            {slides.map((b, i) => (
              <button
                key={`dot-${String(b._id)}`}
                type="button"
                aria-label={`Show spotlight ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setIndex(i)}
                className={`pointer-events-auto h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white shadow-sm' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous spotlight partner"
            onClick={() => go(-1)}
            className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-3 ${HERO_CAROUSEL_NAV_BTN_CLASS}`}
          >
            <FiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next spotlight partner"
            onClick={() => go(1)}
            className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-3 ${HERO_CAROUSEL_NAV_BTN_CLASS}`}
          >
            <FiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}
    </section>
  )
}

export default TouristExploreHeroSection
