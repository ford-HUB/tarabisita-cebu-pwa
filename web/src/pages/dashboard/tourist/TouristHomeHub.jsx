import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from '../../../hooks/useAuth.hook'
import LandingHeroSection from '../../../components/public/LandingHeroSection.jsx'
import TouristVibeDiscoverySection from '../../../components/tourist/home/TouristVibeDiscoverySection.jsx'
import TouristBusinessCarouselSection from '../../../components/tourist/explore/sections/TouristBusinessCarouselSection.jsx'
import {
  buildTouristExploreBusinessDetailHref,
  touristExploreHref,
  touristOrdersHref
} from '../../../components/layout/tourist/touristLayout.constants.js'
import { recordPublicBusinessView } from '../../../services/tourist/touristExplore.service.js'
import { useTouristExploreStore } from '../../../store/tourist/touristExplore.store.js'

const TouristHomeHub = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [touristVibe, setTouristVibe] = useState(null)
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
    navigate(buildTouristExploreBusinessDetailHref(id))
  }

  const handleHeroFeaturedCategory = useCallback((categoryId) => {
    setTouristVibe(categoryId)
    requestAnimationFrame(() => {
      document.getElementById('vibe-discovery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const featuredPlaces = useMemo(() => {
    const list = Array.isArray(businesses) ? [...businesses] : []
    list.sort((a, b) => {
      const va = Number(a?.publicProfileViewCount) || 0
      const vb = Number(b?.publicProfileViewCount) || 0
      if (vb !== va) return vb - va
      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' })
    })
    return list.slice(0, 10)
  }, [businesses])

  return (
    <div className="space-y-8 md:space-y-10">
      {errorMessage && !businesses.length ? (
        <div className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a]">
          <p className="font-medium">We could not load partner listings.</p>
          <p className="mt-1 text-[#b42318]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void loadPublicBusinesses()}
            className="mt-4 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#eb6c12]"
          >
            Try again
          </button>
        </div>
      ) : null}

      <LandingHeroSection
        ctaVariant="tourist"
        userName={user?.name || ''}
        exploreHref={touristExploreHref}
        ordersHref={touristOrdersHref}
        featuredCategoryId={touristVibe}
        onFeaturedCategorySelect={handleHeroFeaturedCategory}
      />

      <TouristVibeDiscoverySection
        businesses={businesses}
        partnersLoading={isLoading}
        onOpenPartner={openBusinessPage}
        activeVibe={touristVibe}
        onActiveVibeChange={setTouristVibe}
      />

      {featuredPlaces.length > 0 ? (
        <div className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm md:p-8">
          <TouristBusinessCarouselSection
            title="Featured places & restaurants"
            subtitle="Popular Tara Bisita partners in Cebu—dining, stays, and local experiences."
            items={featuredPlaces}
            onOpen={openBusinessPage}
            seeAllTo={touristExploreHref}
            seeAllLabel="Browse all"
          />
        </div>
      ) : null}
    </div>
  )
}

export default TouristHomeHub
