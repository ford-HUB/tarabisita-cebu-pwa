import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  FiCoffee,
  FiSun,
  FiFlag,
  FiHome,
  FiShoppingBag,
  FiMoon,
  FiCompass
} from 'react-icons/fi'
import { CEBU_VIBE_CATEGORIES } from '../../shared/constants/cebuVibeDiscovery.constants.js'

const MotionDiv = motion.div

const HERO_VIDEO_URL =
  'https://videos.pexels.com/video-files/36472453/15465549_2560_1440_60fps.mp4'
const HERO_POSTER_URL = '/travel-view.jpg'

const iconForVibeCategory = (id) => {
  switch (id) {
    case 'restaurant':
      return FiCoffee
    case 'beach':
      return FiSun
    case 'heritage':
      return FiFlag
    case 'hotel':
      return FiHome
    case 'market':
      return FiShoppingBag
    case 'nightlife':
      return FiMoon
    default:
      return FiCompass
  }
}

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
const LandingHeroSection = ({
  ctaVariant = 'marketing',
  userName = '',
  exploreHref = '/',
  ordersHref = '/',
  featuredCategoryId = null,
  onFeaturedCategorySelect
}) => {
  const isTourist = ctaVariant === 'tourist'
  const firstName = String(userName || '').trim().split(/\s+/)[0] || 'Explorer'
  const [videoRevealed, setVideoRevealed] = useState(false)

  const revealVideo = useCallback(() => {
    setVideoRevealed(true)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = HERO_VIDEO_URL
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [])

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
        className="inset-0 "
        style={{
          background:
            'linear-gradient(120deg, rgba(22, 15, 10, 0.72), rgba(183, 93, 30, 0.52)), radial-gradient(circle at 14% 20%, rgba(255, 122, 26, 0.28), transparent 40%)'
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
        <MotionDiv
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="z-10"
        >
          <p className="mb-4 inline-flex rounded-full border border-[#f0d9bf]/50 bg-[#fff7ed]/92 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#a85c24] uppercase">
            {isTourist ? `Welcome back, ${firstName}` : 'Built for travelers and local businesses'}
          </p>
          <h1 className="mb-4 text-4xl leading-tight font-semibold text-[#fff5e8] md:text-5xl lg:text-6xl">
            Discover Cebu.
            <br />
            {isTourist ? (
              <>
                Your next favorite spot
                <br />
                is a tap away.
              </>
            ) : (
              <>
                Grow local stores.
                <br />
                All in one platform.
              </>
            )}
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#ffe9d0] md:text-lg">
            {isTourist
              ? 'Pick a vibe, browse verified partners, and plan your day—from food halls to heritage walks and island shores.'
              : 'Tara Bisita connects customers with trusted food spots and tourism experiences, while giving small businesses tools to manage menus, orders, insights, and billing.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isTourist ? (
              <>
                <a
                  href="#vibe-discovery"
                  className="rounded-full bg-[#ff7a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
                >
                  What&apos;s your vibe?
                </a>
                <Link
                  to={exploreHref}
                  className="rounded-full border border-[#ffdfbe] bg-white/92 px-6 py-3 text-sm font-semibold text-[#3d352d] transition hover:border-[#c66b2b] hover:text-[#c66b2b]"
                >
                  Browse all partners
                </Link>
                
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-full bg-[#ff7a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-[#ffdfbe] bg-white/92 px-6 py-3 text-sm font-semibold text-[#3d352d] transition hover:border-[#c66b2b] hover:text-[#c66b2b]"
                >
                  Sign in
                </Link>
              </>
            )}
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
                {isTourist
                  ? 'Curated picks, local partners, and real Cebu energy.'
                  : 'Start your journey and support local entrepreneurs.'}
              </h2>
              <p className="mt-3 max-w-md text-sm text-[#ffedd8]">
                {isTourist
                  ? 'Scroll to set your vibe—then dive into places, plates, and stays that match your mood.'
                  : 'Explore destinations, browse menus, and order from your next favorite business.'}
              </p>
            </div>
          </div>

        </MotionDiv>
      </div>
    </section>
  )
}

export default LandingHeroSection
