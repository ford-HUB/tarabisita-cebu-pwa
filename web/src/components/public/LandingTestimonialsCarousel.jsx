import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAvatarFallback } from '../layout/tourist/touristLayout.constants.js'

const MotionDiv = motion.div

const INTERVAL_MS = 6200

const Stars = ({ rating, compact }) => {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)))
  const starClass = compact ? 'text-[0.72rem] leading-none' : 'text-sm leading-none'
  return (
    <p
      className={`flex text-amber-500 ${compact ? 'gap-px' : 'gap-0.5'}`}
      aria-label={`${r} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${starClass} ${i < r ? 'text-amber-500' : 'text-[#e5ddd4]'}`} aria-hidden>
          ★
        </span>
      ))}
    </p>
  )
}

const resolveDisplayName = (review) => {
  const full = String(review?.authorName || '').trim()
  if (full) return full
  return String(review?.authorLabel || 'Verified diner').trim() || 'Verified diner'
}

/**
 * @param {{ review: Record<string, unknown> }} props
 */
const TestimonialCard = ({ review }) => {
  const name = resolveDisplayName(review)
  const comment = String(review?.comment || '').trim()
  const quote = comment || 'Great experience—thanks for the smooth order.'
  const businessName = String(review?.businessName || 'Partner').trim() || 'Partner'

  return (
    <article
      className={[
        'flex h-full min-h-[220px] w-full max-w-[300px] flex-col rounded-2xl border border-[#e8dfd4] bg-white p-4 shadow-[0_10px_28px_-18px_rgba(73,45,20,0.35)]',
        'transition duration-300 ease-out will-change-transform',
        'hover:-translate-y-1 hover:border-[#e0d2c4] hover:shadow-[0_18px_40px_-22px_rgba(73,45,20,0.38)]'
      ].join(' ')}
    >
      <header className="flex gap-3 border-b border-[#f3ebe3] pb-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ffe8d9]">
          <span
            className="absolute inset-0 flex items-center justify-center bg-[#ff7a1a] text-sm font-semibold text-white"
            aria-hidden
          >
            {getAvatarFallback(name)}
          </span>
          {review?.avatarUrl ? (
            <img
              src={String(review.avatarUrl)}
              alt=""
              className="relative z-10 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden'
              }}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-[#231d18]" title={name}>
            {name}
          </p>
          <div className="mt-1">
            <Stars rating={review?.rating} compact />
          </div>
        </div>
      </header>

      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#3d352d]">
        <span className="line-clamp-4" title={quote}>
          “{quote}”
        </span>
      </blockquote>

      <footer className="mt-auto border-t border-[#f3ebe3] pt-3">
        <p className="text-xs text-[#8a8075]">
          Reviewed:{' '}
          <span className="font-semibold text-[#b86a2a]" title={businessName}>
            <span className="block truncate">{businessName}</span>
          </span>
        </p>
      </footer>
    </article>
  )
}

const skeletonCard = (key) => (
  <div
    key={key}
    className="flex h-full min-h-[220px] w-full max-w-[300px] flex-col rounded-2xl border border-[#ebe3d9] bg-white p-4 shadow-sm"
  >
    <div className="flex gap-3 border-b border-[#f3ebe3] pb-3">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-[#efe6dc]" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-[#efe6dc]" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-[#efe6dc]" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full animate-pulse rounded-full bg-[#efe6dc]" />
      <div className="h-3 w-[92%] animate-pulse rounded-full bg-[#efe6dc]" />
      <div className="h-3 w-[70%] animate-pulse rounded-full bg-[#efe6dc]" />
    </div>
    <div className="mt-auto border-t border-[#f3ebe3] pt-3">
      <div className="h-3 w-32 animate-pulse rounded-full bg-[#efe6dc]" />
    </div>
  </div>
)

const getPerPage = () => {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1280px)').matches) return 3
  if (window.matchMedia('(min-width: 768px)').matches) return 2
  return 1
}

/**
 * @param {{
 *   reviews: Array<{
 *     id: string
 *     rating: number
 *     comment: string
 *     authorLabel?: string
 *     authorName?: string
 *     avatarUrl: string | null
 *     businessName: string
 *     businessId: string
 *   }>
 *   status: 'loading' | 'success' | 'error'
 * }} props
 */
const LandingTestimonialsCarousel = ({ reviews, status }) => {
  const [pageIndex, setPageIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [perPage, setPerPage] = useState(1)

  const slides = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews])
  const slidesSig = useMemo(() => slides.map((s) => s.id).join(','), [slides])
  const prevSigRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const readMotion = () => {
      setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
    const readPerPage = () => setPerPage(getPerPage())
    readMotion()
    readPerPage()
    const mqm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqxl = window.matchMedia('(min-width: 1280px)')
    const mqmd = window.matchMedia('(min-width: 768px)')
    const onMotion = () => readMotion()
    const onLayout = () => readPerPage()
    mqm.addEventListener('change', onMotion)
    mqxl.addEventListener('change', onLayout)
    mqmd.addEventListener('change', onLayout)
    window.addEventListener('resize', onLayout)
    return () => {
      mqm.removeEventListener('change', onMotion)
      mqxl.removeEventListener('change', onLayout)
      mqmd.removeEventListener('change', onLayout)
      window.removeEventListener('resize', onLayout)
    }
  }, [])

  const pageCount = useMemo(
    () => (slides.length ? Math.ceil(slides.length / perPage) : 0),
    [slides.length, perPage]
  )

  const safePage = pageCount ? Math.min(pageIndex, pageCount - 1) : 0
  const visible = useMemo(() => {
    if (!slides.length || !perPage) return []
    const start = safePage * perPage
    return slides.slice(start, start + perPage)
  }, [slides, perPage, safePage])

  useEffect(() => {
    if (prevSigRef.current !== slidesSig) {
      const hadPrior = prevSigRef.current != null
      prevSigRef.current = slidesSig
      if (hadPrior) setPageIndex(0)
    }
  }, [slidesSig])

  const go = useCallback(
    (dir) => {
      if (!pageCount) return
      setPageIndex((p) => {
        const s = Math.min(p, pageCount - 1)
        return (s + dir + pageCount) % pageCount
      })
    },
    [pageCount]
  )

  useEffect(() => {
    if (pageCount <= 1 || paused || reduceMotion) return undefined
    const t = window.setInterval(() => {
      setPageIndex((p) => {
        const s = Math.min(p, pageCount - 1)
        return (s + 1) % pageCount
      })
    }, INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [pageCount, paused, reduceMotion])

  const loading = status === 'loading'
  const cols = visible.length ? Math.min(perPage, visible.length) : perPage

  return (
    <div
      className="relative mx-auto w-full max-w-5xl px-10 sm:px-12 md:px-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {loading ? (
        <div
          className="mx-auto w-full max-w-5xl rounded-2xl border border-[#e7dccd] bg-[#fffdfb]/80 p-4 sm:p-5 md:p-6"
          role="status"
          aria-busy="true"
          aria-label="Loading reviews"
        >
          <div
            className="grid w-full justify-items-center gap-4 md:gap-5"
            style={{ gridTemplateColumns: `repeat(${Math.min(perPage, 3)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: Math.min(perPage, 3) }, (_, i) => skeletonCard(`sk-${i}`))}
          </div>
        </div>
      ) : slides.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[#dccfbc] bg-white/90 px-6 py-12 text-center shadow-inner sm:px-8">
          <p className="text-base font-semibold text-[#2a2119]">Reviews will appear here soon</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d665e]">
            When diners leave feedback on completed orders, highlights show up here—helping new visitors see real
            experiences from the community.
          </p>
        </div>
      ) : (
        <>
          <div className="relative min-h-[240px] sm:min-h-[260px]">
            <AnimatePresence initial={false} mode="wait">
              <MotionDiv
                key={safePage}
                initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -14 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <div
                  className="mx-auto grid w-full max-w-5xl justify-items-center gap-4 sm:gap-4 md:gap-5"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                  }}
                >
                  {visible.map((r) => (
                    <TestimonialCard key={r.id} review={r} />
                  ))}
                </div>
              </MotionDiv>
            </AnimatePresence>

            {pageCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7dccd] bg-white/95 text-[#3d352d] shadow-md transition hover:border-[#c96b2a] hover:text-[#c66b2b] sm:h-10 sm:w-10"
                  aria-label="Previous reviews"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7dccd] bg-white/95 text-[#3d352d] shadow-md transition hover:border-[#c96b2a] hover:text-[#c66b2b] sm:h-10 sm:w-10"
                  aria-label="Next reviews"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          {pageCount > 1 ? (
            <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Review pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === safePage}
                  aria-label={`Show review page ${i + 1}`}
                  onClick={() => setPageIndex(i)}
                  className={[
                    'h-2 rounded-full transition-all',
                    i === safePage ? 'w-8 bg-[#ff7a1a]' : 'w-2 bg-[#dccfbc] hover:bg-[#c9b8a8]'
                  ].join(' ')}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export default LandingTestimonialsCarousel
