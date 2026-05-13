import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useLandingPopularBusinesses } from '../../hooks/useLandingPopularBusinesses.hook.js'
import TouristBusinessCarouselSection from '../tourist/explore/sections/TouristBusinessCarouselSection.jsx'

const MotionDiv = motion.div

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: 'easeOut' }
}

const SkeletonStrip = () => (
  <div
    className={
      'gap-3 pb-2 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-3 ' +
      'max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden ' +
      'md:grid md:grid-cols-[repeat(auto-fill,minmax(12rem,14rem))] md:justify-start md:gap-4'
    }
    aria-hidden
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div
        key={i}
        className="max-md:w-44 max-md:max-w-[min(85vw,13.5rem)] max-md:snap-start max-md:shrink-0 md:min-w-0 md:w-full md:max-w-56"
      >
        <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-[#e8dfd5]" />
      </div>
    ))}
  </div>
)

const LandingPopularPlacesSection = () => {
  const navigate = useNavigate()
  const { businesses, status } = useLandingPopularBusinesses({ limit: 10 })

  const goSignIn = () => {
    navigate('/login')
  }

  return (
    <section
      id="popular-places"
      className="scroll-mt-24 border-y border-[#eadfce] py-16 md:py-20 lg:py-24"
      aria-label="Popular places and restaurants"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        {status === 'loading' ? <SkeletonStrip /> : null}

        {status === 'success' && businesses.length > 0 ? (
          <MotionDiv {...fadeUp}>
            <TouristBusinessCarouselSection
              title="Popular places & restaurants"
              subtitle="Ranked by diner ratings from completed orders, then community interest. Tap a card to sign in and open Explore."
              items={businesses}
              onOpen={goSignIn}
            />
          </MotionDiv>
        ) : null}

        {status === 'success' && !businesses.length ? (
          <p className="rounded-2xl border border-dashed border-[#dccfbc] bg-white/80 px-6 py-10 text-center text-sm text-[#6d665e]">
            Partner listings will show here once verified businesses are live on the public catalog.
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] px-6 py-8 text-center text-sm text-[#7a271a]">
            We could not load popular places right now. Please refresh the page or try again after signing in.
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default LandingPopularPlacesSection
