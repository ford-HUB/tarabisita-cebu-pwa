import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { buildTouristSearchHref } from '../layout/tourist/touristLayout.constants.js'

const MotionDiv = motion.div

const HERO_VIDEO_URL =
  'https://videos.pexels.com/video-files/36472453/15465549_2560_1440_60fps.mp4'
const HERO_POSTER_URL = '/travel-view.jpg'

/**
 * @param {{
 *   ctaVariant?: 'marketing' | 'tourist',
 *   userName?: string,
 *   exploreHref?: string,
 *   ordersHref?: string,
 *   featuredCategoryId?: string | null,
 *   onFeaturedCategorySelect?: (categoryId: string) => void
 * }} props
 */
const LandingHeroSection = (props) => {
  const {
    ctaVariant = 'marketing',
    userName = '',
    exploreHref = '/',
    onFeaturedCategorySelect
  } = props
  const isTourist = ctaVariant === 'tourist'
  const firstName = String(userName || '').trim().split(/\s+/)[0] || 'Explorer'
  const [videoRevealed, setVideoRevealed] = useState(false)
  const [heroQuery, setHeroQuery] = useState('')
  const navigate = useNavigate()

  const revealVideo = useCallback(() => {
    setVideoRevealed(true)
  }, [])

  useEffect(() => {
    if (isTourist || typeof document === 'undefined') return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = HERO_VIDEO_URL
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [isTourist])

  const handleTouristSearchSubmit = useCallback(
    (e) => {
      e.preventDefault()
      navigate(buildTouristSearchHref(heroQuery))
    },
    [heroQuery, navigate]
  )

  if (isTourist) {
    return (
      <section className="relative ml-[calc(50%-50vw)] w-screen overflow-x-clip overflow-hidden border-b border-[#eadfce]">
        <div className="pointer-events-none absolute inset-0 z-0">
          <video src={HERO_VIDEO_URL} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(12,18,28,0.55)_0%,rgba(8,12,22,0.45)_45%,rgba(6,10,18,0.62)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[min(92svh,calc(100svh-64px))] w-full max-w-4xl flex-col items-center justify-center px-5 py-14 text-center sm:px-8 md:py-20">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="flex w-full max-w-3xl flex-col items-center"
          >
            <h1 className="mb-5 text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.08] font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
              <span className="text-white">TARA,</span>{' '}
              <span className="text-[#ffe94a]">Bisita Cebu</span>
            </h1>
            <p className="mb-10 max-w-xl text-base font-medium leading-relaxed text-white/95 drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] sm:text-lg">
              Discover the Queen City of the South. From pristine beaches to world-class lechon.
            </p>

            <form
              onSubmit={handleTouristSearchSubmit}
              className="w-full max-w-xl"
              role="search"
              aria-label="Search catalog"
            >
              <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/18 py-1.5 pl-3 pr-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:gap-3 sm:pl-4 sm:pr-2">
                <FiSearch className="h-5 w-5 shrink-0 text-white/90 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
                <input
                  type="search"
                  name="tourist-hero-search"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Where to next? (e.g., Moalboal, Lechon)"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/55 sm:text-[0.9375rem]"
                  autoComplete="off"
                  enterKeyHint="search"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] sm:px-6"
                >
                  Explore
                </button>
              </div>
            </form>

            <p className="mt-3 text-xs text-white/55 sm:text-[13px]">
              Welcome back, {firstName} — search dishes and stay packages, or jump in below.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium">
              <a
                href="#vibe-discovery"
                onClick={(e) => {
                  if (!onFeaturedCategorySelect) return
                  e.preventDefault()
                  onFeaturedCategorySelect('')
                }}
                className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                What&apos;s your vibe?
              </a>
              <Link
                to={exploreHref}
                className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                Browse all partners
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>
    )
  }

  return (
    <section className="relative ml-[calc(50%-50vw)] w-screen overflow-x-clip overflow-hidden border-b border-[#eadfce]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(145deg,#1a100c_0%,#2d1810_45%,#3d2416_100%)]"
        aria-hidden
      />
      <video
        className={[
          'pointer-events-none absolute left-1/2 top-1/2 z-0 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover transition-opacity duration-[1100ms] ease-out motion-reduce:transition-none',
          videoRevealed ? 'opacity-100' : 'opacity-0'
        ].join(' ')}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={revealVideo}
        onPlaying={revealVideo}
      >
        <source src={HERO_VIDEO_URL} type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(120deg, rgba(22, 15, 10, 0.72), rgba(183, 93, 30, 0.52)), radial-gradient(circle at 14% 20%, rgba(255, 122, 26, 0.28), transparent 40%)'
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
        <MotionDiv
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="z-10"
        >
          <p className="mb-4 inline-flex rounded-full border border-[#f0d9bf]/50 bg-[#fff7ed]/92 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#a85c24] uppercase">
            Built for travelers and local businesses
          </p>
          <h1 className="mb-4 text-4xl leading-tight font-semibold text-[#fff5e8] md:text-5xl lg:text-6xl">
            Discover Cebu.
            <br />
            Grow local stores.
            <br />
            All in one platform.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#ffe9d0] md:text-lg">
            Discover the best places, restaurants, hotels, nightlife, and tourist destinations in Cebu — all in one
            platform. Plan your trip, explore local experiences, order food, book services, and connect with trusted
            local businesses easily.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <a
                href="#popular-places"
                className="rounded-full border border-[#ffdfbe] bg-white/92 px-5 py-3 text-center text-sm font-semibold text-[#3d352d] transition hover:border-[#c66b2b] hover:text-[#c66b2b] sm:min-w-[9.5rem]"
              >
                Explore Cebu
              </a>

              <Link
                to="/register"
                className="rounded-full bg-[#ff7a1a] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#eb6c12] sm:min-w-[9.5rem]"
              >
                Start Your Journey
              </Link>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#f0d8c0]/55 shadow-[0_30px_80px_-35px_rgba(90,45,20,0.45)]">
            <img
              src={HERO_POSTER_URL}
              alt="Cebu travel view"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,7,0.15),rgba(32,18,10,0.72))]" />
            <div className="relative flex min-h-[460px] flex-col justify-end p-7 text-[#fff6e9]">
              <p className="mb-2 text-xs tracking-[0.18em] uppercase">Cebu Experience</p>
              <h2 className="text-3xl leading-tight font-semibold">
                Start your journey and support local entrepreneurs.
              </h2>
              <p className="mt-3 max-w-md text-sm text-[#ffedd8]">
                Explore destinations, browse menus, and order from your next favorite business.
              </p>
            </div>
          </div>
        </MotionDiv>
      </div>
    </section>
  )
}

export default LandingHeroSection
