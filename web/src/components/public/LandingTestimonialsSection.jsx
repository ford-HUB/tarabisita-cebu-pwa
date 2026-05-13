import { motion } from 'motion/react'
import { useLandingRestaurantReviews } from '../../hooks/useLandingRestaurantReviews.hook.js'
import LandingTestimonialsCarousel from './LandingTestimonialsCarousel.jsx'

const MotionDiv = motion.div

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' }
}

const LandingTestimonialsSection = () => {
  const { reviews, status } = useLandingRestaurantReviews({ limit: 12 })

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 border-t border-[#eadfce] bg-[linear-gradient(180deg,#f8f5f0_0%,#fffdfb_55%,#f8f5f0_100%)] py-20 lg:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <MotionDiv {...fadeUp} className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#b86a2a] uppercase">Community voices</p>
          <h2 id="testimonials-heading" className="mt-3 text-3xl font-semibold text-[#231d18] md:text-4xl">
            What diners are saying
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6f675e]">
            Real ratings and comments from tourists who completed orders—pulled live from the platform so newcomers can
            see trustworthy feedback.
          </p>
        </MotionDiv>

        <LandingTestimonialsCarousel reviews={reviews} status={status} />
      </div>
    </section>
  )
}

export default LandingTestimonialsSection
