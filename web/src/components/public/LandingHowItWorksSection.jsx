import { motion } from 'motion/react'
import { FiUserPlus, FiCompass, FiShoppingCart, FiStar, FiShare2 } from 'react-icons/fi'

const MotionDiv = motion.div
const MotionLi = motion.li

const steps = [
  {
    step: 1,
    title: 'Create an account',
    body: 'Sign up as a tourist to unlock explore, cart, checkout, and your order history in one profile.',
    Icon: FiUserPlus
  },
  {
    step: 2,
    title: 'Explore destinations and restaurants',
    body: 'Filter by category, read summaries, and open business profiles with menus and real review signals.',
    Icon: FiCompass
  },
  {
    step: 3,
    title: 'Order or book services',
    body: 'Add items, choose supported payment options where available, and complete your purchase securely.',
    Icon: FiShoppingCart
  },
  {
    step: 4,
    title: 'Leave ratings and reviews',
    body: 'After eligible orders, share a star rating and short comment to help the next traveler decide.',
    Icon: FiStar
  },
  {
    step: 5,
    title: 'Share your Cebu experience',
    body: 'Return for your next trip, reorder favorites, and keep supporting trusted local businesses.',
    Icon: FiShare2
  }
]

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' }
}

const LandingHowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 py-20 lg:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <MotionDiv {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
          <h2 id="how-it-works-heading" className="mt-3 text-3xl font-semibold text-[#231d18] md:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6f675e]">
            From first visit to your next favorite spot—five straightforward steps to get value from Tara Bisita.
          </p>
        </MotionDiv>

        <div className="relative">
          <div
            className="absolute top-8 bottom-8 left-[1.35rem] hidden w-px bg-gradient-to-b from-[#ffd4a8] via-[#e7dccd] to-transparent md:block lg:left-1/2 lg:-translate-x-1/2"
            aria-hidden
          />
          <ol className="relative grid gap-8 md:gap-10">
            {steps.map((item, index) => {
              const Icon = item.Icon
              const isRight = index % 2 === 1
              return (
                <MotionLi
                  key={item.step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.48, delay: 0.05 * index, ease: 'easeOut' }}
                  className={[
                    'grid items-center gap-6 md:grid-cols-2 md:gap-10',
                    isRight ? 'md:[&>div:first-child]:order-2' : ''
                  ].join(' ')}
                >
                  <div className={isRight ? 'md:text-right' : ''}>
                    <div
                      className={[
                        'inline-flex items-center gap-3 rounded-2xl border border-[#e7dccd] bg-white px-4 py-3 shadow-[0_14px_32px_-26px_rgba(73,45,20,0.45)]',
                        isRight ? 'md:flex-row-reverse' : ''
                      ].join(' ')}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a] text-sm font-bold text-white">
                        {item.step}
                      </span>
                      <div className={isRight ? 'md:text-right' : ''}>
                        <p className="text-xs font-medium tracking-wide text-[#b86a2a] uppercase">Step {item.step}</p>
                        <p className="text-lg font-semibold text-[#2a2119]">{item.title}</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={[
                      'flex gap-4 rounded-2xl border border-[#ebe3d9] bg-white/90 p-5 shadow-[0_12px_28px_-22px_rgba(73,45,20,0.4)]',
                      isRight ? 'md:flex-row-reverse md:text-right' : ''
                    ].join(' ')}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3e8] text-[#c96b2a]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed text-[#6d665e]">{item.body}</p>
                  </div>
                </MotionLi>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default LandingHowItWorksSection
