import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAvatarFallback } from '../layout/tourist/touristLayout.constants.js'

const MotionDiv = motion.div

const INTERVAL_MS = 5600

const Stars = ({ rating }) => {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)))
  return (
    <p className="flex gap-0.5 text-amber-500" aria-label={`${r} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < r ? 'text-amber-500' : 'text-[#e5ddd4]'} aria-hidden>
          ★
        </span>
      ))}
    </p>
  )
}

/**
 * @param {{
 *   reviews: Array<{
 *     id: string
 *     rating: number
 *     comment: string
 *     authorLabel: string
 *     avatarUrl: string | null
 *     businessName: string
 *     businessId: string
 *   }>
 *   status: 'loading' | 'success' | 'error'
 * }} props
 */
const LandingTestimonialsCarousel = ({ reviews, status }) => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotionRef = useRef(false)

  const slides = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotionRef.current = mq.matches
    const onChange = () => {
      reduceMotionRef.current = mq.matches
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const go = useCallback(
    (dir) => {
      if (!slides.length) return
      setIndex((i) => (i + dir + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (slides.length <= 1 || paused || reduceMotionRef.current) return undefined
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [slides.length, paused])

  const loading = status === 'loading' || status === 'idle'
  const slideIndex = slides.length ? ((index % slides.length) + slides.length) % slides.length : 0
  const current = slides[slideIndex] || null

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {loading ? (
        <div
          className="min-h-[280px] rounded-3xl border border-[#e7dccd] bg-white p-10 shadow-[0_20px_50px_-34px_rgba(73,45,20,0.45)]"
          role="status"
          aria-busy="true"
          aria-label="Loading reviews"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-28 rounded-full bg-[#efe6dc]" />
            <div className="h-3 w-full max-w-md rounded-full bg-[#efe6dc]" />
            <div className="h-3 w-full max-w-sm rounded-full bg-[#efe6dc]" />
            <div className="mt-8 flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#efe6dc]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded-full bg-[#efe6dc]" />
                <div className="h-3 w-48 rounded-full bg-[#efe6dc]" />
              </div>
            </div>
          </div>
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dccfbc] bg-white/90 px-8 py-14 text-center shadow-inner">
          <p className="text-lg font-medium text-[#2a2119]">Reviews will appear here soon</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d665e]">
            When diners leave feedback on completed orders, highlights show up on this carousel—helping new visitors
            see real experiences from the community.
          </p>
        </div>
      ) : (
        <div className="relative overflow-visible rounded-3xl border border-[#e7dccd] bg-white shadow-[0_24px_56px_-32px_rgba(73,45,20,0.48)]">
          <AnimatePresence initial={false} mode="wait">
            {current ? (
              <MotionDiv
                key={current.id}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className="px-8 py-10 md:px-12 md:py-12"
              >
                <Stars rating={current.rating} />
                <blockquote className="mt-4 text-lg leading-relaxed font-medium text-[#2a2119] md:text-xl">
                  {current.comment ? `“${current.comment}”` : '“Great experience—thanks for the smooth order.”'}
                </blockquote>
                <footer className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#f0e6dc] pt-8">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ffe8d9]">
                    <span
                      className="absolute inset-0 flex items-center justify-center bg-[#ff7a1a] text-base font-semibold text-white"
                      aria-hidden
                    >
                      {getAvatarFallback(current.authorLabel)}
                    </span>
                    {current.avatarUrl ? (
                      <img
                        src={current.avatarUrl}
                        alt=""
                        className="relative z-10 h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2a2119]">{current.authorLabel}</p>
                    <p className="mt-1 text-sm text-[#6d665e]">
                      reviewed <span className="font-medium text-[#b86a2a]">{current.businessName}</span>
                    </p>
                  </div>
                </footer>
              </MotionDiv>
            ) : null}
          </AnimatePresence>

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7dccd] bg-white/95 text-[#3d352d] shadow-md transition hover:border-[#c96b2a] hover:text-[#c96b2a] md:left-4"
                aria-label="Previous review"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7dccd] bg-white/95 text-[#3d352d] shadow-md transition hover:border-[#c96b2a] hover:text-[#c96b2a] md:right-4"
                aria-label="Next review"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
              <div className="flex justify-center gap-2 pb-6" role="tablist" aria-label="Review slides">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === slideIndex}
                    aria-label={`Show review ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={[
                      'h-2 rounded-full transition-all',
                      i === slideIndex ? 'w-8 bg-[#ff7a1a]' : 'w-2 bg-[#dccfbc] hover:bg-[#c9b8a8]'
                    ].join(' ')}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default LandingTestimonialsCarousel
