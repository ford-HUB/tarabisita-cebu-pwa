import { motion } from 'motion/react'

const MotionDiv = motion.div
const MotionArticle = motion.article

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' }
}

const features = [
  {
    id: 'spots',
    emoji: '🌴',
    title: 'Discover Tourist Spots',
    description: 'Curated destinations, heritage sites, and beaches so you can plan days that match your vibe.'
  },
  {
    id: 'restaurants',
    emoji: '🍽',
    title: 'Explore Local Restaurants',
    description: 'Browse menus, photos, and verified partners—order when you are ready with a clear checkout flow.'
  },
  {
    id: 'hotels',
    emoji: '🏨',
    title: 'Find Hotels & Stays',
    description: 'Compare stays and booking-friendly listings in one place as partners expand on the platform.'
  },
  {
    id: 'nightlife',
    emoji: '🌃',
    title: 'Experience Cebu Nightlife',
    description: 'Discover evening spots and experiences to round out your trip from sunset to late night.'
  },
  {
    id: 'orders',
    emoji: '🛒',
    title: 'Order Food & Services',
    description: 'Place menu orders with supported online payments and track your purchase with confidence.'
  },
  {
    id: 'reviews',
    emoji: '⭐',
    title: 'Trusted Reviews & Ratings',
    description: 'Read feedback from diners who completed real orders—stars and comments you can trust.'
  }
]

const LandingWhyChooseSection = () => {
  return (
    <section
      id="why-choose"
      className="scroll-mt-24 border-y border-[#eadfce]  py-20 lg:py-24"
      aria-labelledby="why-choose-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <MotionDiv {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#b86a2a] uppercase">Why Tara Bisita</p>
          <h2 id="why-choose-heading" className="mt-3 text-3xl font-semibold text-[#231d18] md:text-4xl">
            Why choose our platform?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6f675e]">
            Everything you need to explore Cebu with clarity—discovery, ordering, and community-backed signals in a
            single modern experience.
          </p>
        </MotionDiv>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => {
            
            return (
              <MotionArticle
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: 0.06 * index, ease: 'easeOut' }}
                id={item.id === 'restaurants' ? 'feature-restaurants' : undefined}
                className={[
                  'group relative overflow-hidden rounded-2xl border border-[#e7dccd] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(73,45,20,0.45)]',
                  'transition duration-300 ease-out will-change-transform',
                  'hover:-translate-y-1 hover:border-[#e0c9b0] hover:shadow-[0_24px_48px_-24px_rgba(90,45,20,0.38)]'
                ].join(' ')}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(circle at 20% 0%, rgba(255, 122, 26, 0.08), transparent 55%)'
                  }}
                  aria-hidden
                />
                <div className="relative flex items-start gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3e8] text-xl ring-1 ring-[#ffd8b8]/80 transition duration-300 group-hover:scale-105 group-hover:bg-[#ffe8d9]"
                    aria-hidden
                  >
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-[#2a2119]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6d665e]">{item.description}</p>
                  </div>
                </div>
              </MotionArticle>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LandingWhyChooseSection
