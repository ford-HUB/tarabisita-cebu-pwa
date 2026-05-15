import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import LandingHeroSection from '../../components/public/LandingHeroSection.jsx'
import LandingWhyChooseSection from '../../components/public/LandingWhyChooseSection.jsx'
import LandingHowItWorksSection from '../../components/public/LandingHowItWorksSection.jsx'
import LandingTestimonialsSection from '../../components/public/LandingTestimonialsSection.jsx'
import LandingPopularPlacesSection from '../../components/public/LandingPopularPlacesSection.jsx'
import TouristVibeDiscoverySection from '../../components/tourist/home/TouristVibeDiscoverySection.jsx'
import { buildPublicBusinessDetailHref } from '../../shared/constants/publicCatalog.constants.js'
import { recordPublicBusinessView } from '../../services/tourist/touristExplore.service.js'
import { useTouristExploreStore } from '../../store/tourist/touristExplore.store.js'

const MotionDiv = motion.div
const MotionArticle = motion.article

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: 'easeOut' }
}

const Landing = () => {
  const navigate = useNavigate()
  const [guestVibe, setGuestVibe] = useState(null)
  const { businesses, isLoading, errorMessage, loadPublicBusinesses } = useTouristExploreStore(
    useShallow((s) => ({
      businesses: s.businesses,
      isLoading: s.isLoading,
      errorMessage: s.errorMessage,
      loadPublicBusinesses: s.loadPublicBusinesses
    }))
  )

  useEffect(() => {
    void loadPublicBusinesses()
  }, [loadPublicBusinesses])

  const openBusinessPage = (business) => {
    const id = String(business?._id || '').trim()
    if (!id) return
    void recordPublicBusinessView(id).catch(() => {})
    navigate(buildPublicBusinessDetailHref(id))
  }

  const scrollToVibeDiscovery = useCallback(() => {
    document.getElementById('vibe-discovery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleHeroFeaturedCategory = useCallback(
    (categoryId) => {
      if (categoryId) setGuestVibe(categoryId)
      requestAnimationFrame(scrollToVibeDiscovery)
    },
    [scrollToVibeDiscovery]
  )

  return (
    <motion.div className="bg-[#f8f5f0] text-[#1f1f1f]">
      <LandingHeroSection
        ctaVariant="public"
        exploreHref="/#vibe-discovery"
        featuredCategoryId={guestVibe}
        onFeaturedCategorySelect={handleHeroFeaturedCategory}
      />

      {errorMessage && !businesses.length ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-6 max-w-6xl px-6 lg:px-10"
        >
          <motion.div className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a]">
            <p className="font-medium">We could not load partner listings.</p>
            <p className="mt-1 text-[#b42318]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadPublicBusinesses()}
              className="mt-4 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#eb6c12]"
            >
              Try again
            </button>
          </motion.div>
        </motion.div>
      ) : null}

      <motion.div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <TouristVibeDiscoverySection
          businesses={businesses}
          partnersLoading={isLoading}
          onOpenPartner={openBusinessPage}
          activeVibe={guestVibe}
          onActiveVibeChange={setGuestVibe}
        />
      </motion.div>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10">
        <MotionDiv {...fadeUp} className="mb-8 text-center">
          <h3 className="text-3xl font-semibold text-[#231d18]">What Tara Bisita is all about</h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#6f675e]">
            A connected ecosystem for tourists and communities, helping customers discover better options while helping
            businesses grow with confidence.
          </p>
        </MotionDiv>

        <motion.div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'For Customers',
              body: 'Find places faster, compare offers, check details, and order with a smooth and simple flow.'
            },
            {
              title: 'For Small Businesses',
              body: 'Manage your profile, menus, orders, and reports from one modern dashboard built for daily operations.'
            },
            {
              title: 'For Local Economy',
              body: 'Increase visibility of local stores and destinations to help communities earn and thrive.'
            }
          ].map((item, index) => (
            <MotionArticle
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
              className="rounded-2xl border border-[#e7dccd] bg-white p-6 shadow-[0_16px_36px_-28px_rgba(73,45,20,0.52)]"
            >
              <h4 className="mb-2 text-lg font-semibold text-[#2a2119]">{item.title}</h4>
              <p className="text-sm leading-7 text-[#6d665e]">{item.body}</p>
            </MotionArticle>
          ))}
        </motion.div>
      </section>

      <LandingPopularPlacesSection />

      <LandingWhyChooseSection />

      <LandingHowItWorksSection />

      <LandingTestimonialsSection />
    </motion.div>
  )
}

export default Landing
