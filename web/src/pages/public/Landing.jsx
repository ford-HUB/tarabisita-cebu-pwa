import { motion } from 'motion/react'
import LandingHeroSection from '../../components/public/LandingHeroSection.jsx'

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: 'easeOut' },
}

const Landing = () => {
  return (
    <div className="bg-[#f8f5f0] text-[#1f1f1f]">
      <LandingHeroSection ctaVariant="marketing" />
      
      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10">
        <motion.div {...fadeUp} className="mb-8 text-center">
          <h3 className="text-3xl font-semibold text-[#231d18]">What Tara Bisita is all about</h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#6f675e]">
            A connected ecosystem for tourists and communities, helping customers discover better
            options while helping businesses grow with confidence.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'For Customers',
              body: 'Find places faster, compare offers, check details, and order with a smooth and simple flow.',
            },
            {
              title: 'For Small Businesses',
              body: 'Manage your profile, menus, orders, and reports from one modern dashboard built for daily operations.',
            },
            {
              title: 'For Local Economy',
              body: 'Increase visibility of local stores and destinations to help communities earn and thrive.',
            },
          ].map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
              className="rounded-2xl border border-[#e7dccd] bg-white p-6 shadow-[0_16px_36px_-28px_rgba(73,45,20,0.52)]"
            >
              <h4 className="mb-2 text-lg font-semibold text-[#2a2119]">{item.title}</h4>
              <p className="text-sm leading-7 text-[#6d665e]">{item.body}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Landing
