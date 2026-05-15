import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTouristExplore } from '../../../hooks/useTouristExplore.hook'
import { useTouristExploreMenuDeepLink } from '../../../hooks/useTouristExploreMenuDeepLink.hook'
import {
  buildTouristExploreBusinessDetailHref,
  touristStayBookingHref
} from '../../../components/layout/tourist/touristLayout.constants.js'
import { recordPublicBusinessView } from '../../../services/tourist/touristExplore.service.js'
import { fetchPublicBusinessById } from '../../../services/tourist/touristExplore.service.js'
import TouristExploreHeroSection from '../../../components/tourist/explore/sections/TouristExploreHeroSection'
import TouristExploreIntentsSection from '../../../components/tourist/explore/sections/TouristExploreIntentsSection'
import TouristBusinessCarouselSection from '../../../components/tourist/explore/sections/TouristBusinessCarouselSection'
import TouristExploreLoadingSection from '../../../components/tourist/explore/sections/TouristExploreLoadingSection'
import TouristMenuItemDetailModal from '../../../components/tourist/explore/modals/TouristMenuItemDetailModal'
import TouristStayPackageDetailModal from '../../../components/tourist/explore/modals/TouristStayPackageDetailModal.jsx'
import TouristExploreRightRailSection from '../../../components/tourist/explore/sections/TouristExploreRightRailSection'
import TouristExploreFoodMenuSection from '../../../components/tourist/explore/sections/TouristExploreFoodMenuSection'
import TouristCategoryChipsSection from '../../../components/tourist/explore/sections/TouristCategoryChipsSection'
import { categoryMatchesLabel } from '../../../shared/utils/touristExplore.utils.js'
import { useTouristCartItemStore } from '../../../store/tourist/tourist-cart-item.store.js'
import { pickCartItemDetailsFromMenuItem } from '../../../shared/utils/tourist-cart-item-details.utils.js'

const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const Home = () => {
  const {
    user,
    heroSpotlightBusinesses,
    exploreRows,
    filterChips,
    serviceIntents,
    intentHighlightId,
    showPartnerTypeChips,
    categoryFilter,
    setCategoryFilter,
    stayTypeFilter,
    setStayTypeFilter,
    foodMenuCategory,
    setFoodMenuCategory,
    menuFeedItems,
    menuFeedCategories,
    menuFeedLoading,
    menuFeedError,
    isLoading,
    errorMessage,
    filteredBusinesses,
    businesses,
    reload
  } = useTouristExplore()
  const navigate = useNavigate()

  const userName = user?.name || 'Tourist'
  const [isExploreRailCollapsed, setIsExploreRailCollapsed] = useState(true)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [stayPackages, setStayPackages] = useState([])
  const [stayPackagesLoading, setStayPackagesLoading] = useState(false)
  const [stayPackagesError, setStayPackagesError] = useState('')
  const [selectedStayPackage, setSelectedStayPackage] = useState(null)
  const addCartItem = useTouristCartItemStore((s) => s.addItem)

  useTouristExploreMenuDeepLink(setSelectedMenuItem)

  const stayBusinesses = useMemo(
    () =>
      filteredBusinesses.filter(
        (business) => categoryMatchesLabel(business?.category, 'Resort') || categoryMatchesLabel(business?.category, 'Hotel')
      ),
    [filteredBusinesses]
  )

  useEffect(() => {
    if (categoryFilter !== 'INTENT_STAY') return
    if (!stayBusinesses.length) {
      setStayPackages([])
      setStayPackagesError('')
      return
    }
    let cancelled = false
    setStayPackagesLoading(true)
    setStayPackagesError('')
    void Promise.all(stayBusinesses.map((business) => fetchPublicBusinessById(String(business?._id || ''))))
      .then((responses) => {
        if (cancelled) return
        const allPackages = []
        for (const res of responses) {
          const businessData = res?.data?.data
          const businessId = String(businessData?._id || '')
          const businessName = String(businessData?.name || 'Resort')
          const menuItems = Array.isArray(businessData?.menuItems) ? businessData.menuItems : []
          for (const item of menuItems) {
            if (item?.isDeleted) continue
            if (!item?.isAvailable) continue
            if (String(item?.stockStatus || '').trim().toUpperCase() === 'OUT_OF_STOCK') continue
            allPackages.push({
              ...item,
              businessId,
              businessName
            })
          }
        }
        setStayPackages(allPackages)
      })
      .catch((err) => {
        if (cancelled) return
        setStayPackages([])
        setStayPackagesError(err?.response?.data?.message || err?.message || 'Could not load resort packages.')
      })
      .finally(() => {
        if (!cancelled) setStayPackagesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [categoryFilter, stayBusinesses])

  const openBusinessPage = (business) => {
    const id = String(business?._id || '').trim()
    if (!id) return
    void recordPublicBusinessView(id).catch(() => {})
    navigate(buildTouristExploreBusinessDetailHref(id))
  }

  const buildStayCartPayload = (item) => {
    if (!item) return null
    const image = Array.isArray(item.images) && item.images.length ? item.images[0] : ''
    return {
      businessId: String(item.businessId || ''),
      businessName: item.businessName || 'Resort',
      catalogItemId: String(item.id || ''),
      name: item.name || 'Stay package',
      unitPrice: Number(item.price) || 0,
      image,
      qty: 1,
      listingType: 'STAY',
      ...pickCartItemDetailsFromMenuItem(item)
    }
  }

  const handleAddStayToCart = (item) => {
    const payload = buildStayCartPayload(item)
    if (!payload?.businessId || !payload?.catalogItemId) return
    addCartItem(payload)
  }

  const handleBookNowStay = (item) => {
    setSelectedStayPackage(null)
    navigate(touristStayBookingHref, {
      state: {
        stayPackage: item,
        stayBusiness: {
          _id: item?.businessId || '',
          name: item?.businessName || 'Resort'
        }
      }
    })
  }

  if (isLoading && !businesses.length) {
    return (
      <div className="space-y-6 md:space-y-8">
        <TouristExploreLoadingSection />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {errorMessage && !businesses.length ? (
        <div className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a]">
          <p className="font-medium">We couldn&apos;t load listings.</p>
          <p className="mt-1 text-[#b42318]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => reload()}
            className="mt-4 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#eb6c12]"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!errorMessage || businesses.length ? (
        <div
          className={
            isExploreRailCollapsed
              ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_2.75rem] lg:items-start lg:gap-x-2 lg:gap-y-0'
              : 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(15rem,26vw)] lg:items-start lg:gap-x-5 lg:gap-y-0 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,24vw)] xl:gap-x-8 2xl:gap-x-10'
          }
        >
          <div className="min-w-0 space-y-6 md:space-y-8">
            {heroSpotlightBusinesses.length ? (
              <TouristExploreHeroSection
                userName={userName}
                businesses={heroSpotlightBusinesses}
                onOpen={openBusinessPage}
              />
            ) : (
              <section className="rounded-2xl border border-[#e7dfd5] bg-linear-to-r from-[#9b5a2c] to-[#ff7a1a] p-6 text-white shadow-sm md:p-8">
                <p className="text-sm uppercase tracking-wider text-white/85">Order &amp; book in Cebu</p>
                <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Hello, {userName}!</h1>
                <p className="mt-2 max-w-none text-sm text-white/90 md:text-base">
                  Soon you&apos;ll order meals, book stays, and arrange rentals with verified partners — all in one place.
                </p>
              </section>
            )}

            <div className="lg:hidden">
              <TouristExploreIntentsSection
                intents={serviceIntents}
                highlightIntentId={intentHighlightId}
                allPartnersActive={categoryFilter === 'ALL'}
                onSelect={setCategoryFilter}
              />
            </div>

            {showPartnerTypeChips ? (
              <div className="space-y-2.5 lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Partner type</p>
                <TouristCategoryChipsSection chips={filterChips} activeId={categoryFilter} onSelect={setCategoryFilter} />
              </div>
            ) : null}

            {!filteredBusinesses.length && businesses.length ? (
              <p className="rounded-xl border border-[#e7dfd5] bg-white p-4 text-sm text-[#5b5b5b]">
                No partners match this filter yet. Try another goal, pick a partner type, or view all partners.
              </p>
            ) : null}

            {categoryFilter === 'INTENT_FOOD' ? (
              <TouristExploreFoodMenuSection
                foodMenuCategory={foodMenuCategory}
                onFoodMenuCategoryChange={setFoodMenuCategory}
                categories={menuFeedCategories}
                items={menuFeedItems}
                isLoading={menuFeedLoading}
                errorMessage={menuFeedError}
                onOpenMenuItem={setSelectedMenuItem}
              />
            ) : null}

            {categoryFilter === 'INTENT_STAY' ? (
              <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Book to Stay</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1f1f1f]">Resort posted packages</h2>
                  </div>
                </div>

                {stayPackagesLoading ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="animate-pulse overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f5eee4]">
                        <div className="aspect-4/3 bg-[#ece3d9]" />
                        <div className="space-y-2 p-3">
                          <div className="h-4 w-[75%] rounded bg-[#ece3d9]" />
                          <div className="h-3 w-1/2 rounded bg-[#ece3d9]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!stayPackagesLoading && stayPackagesError ? (
                  <p className="mt-4 rounded-lg border border-[#fecdca] bg-[#fff4f2] p-3 text-sm text-[#b42318]">
                    {stayPackagesError}
                  </p>
                ) : null}

                {!stayPackagesLoading && !stayPackagesError && !stayPackages.length ? (
                  <p className="mt-4 rounded-lg border border-dashed border-[#e7dfd5] bg-[#fcfaf7] p-4 text-sm text-[#6b5f54]">
                    No available packages to book from resort accounts yet.
                  </p>
                ) : null}

                {!stayPackagesLoading && !stayPackagesError && stayPackages.length ? (
                  <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {stayPackages.map((item) => {
                      const image = Array.isArray(item.images) && item.images.length ? item.images[0] : ''
                      const amenitiesText = String(item?.amenities || item?.amities || item?.allergens || '').trim()
                      return (
                        <li key={String(item?.id || '')}>
                          <button
                            type="button"
                            onClick={() => setSelectedStayPackage(item)}
                            className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] text-left shadow-sm transition hover:border-[#d4c4b6] hover:shadow-md"
                          >
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-[#ece3d9]">
                              {image ? (
                                <img
                                  src={image}
                                  alt=""
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#a79a8b]">
                                  No photo
                                </div>
                              )}
                              <span className="absolute right-2 top-2 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                                Available
                              </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-1 p-3">
                              <p className="line-clamp-2 text-sm font-semibold text-[#1f1f1f]">{item.name}</p>
                              <p className="text-xs text-[#5b5b5b]">{item.businessName || 'Resort'}</p>
                              {item.category ? (
                                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9b5a2c]">{item.category}</p>
                              ) : null}
                              {amenitiesText ? (
                                <p className="line-clamp-1 text-[11px] text-[#5b5b5b]">Amenities: {amenitiesText}</p>
                              ) : null}
                              <p className="mt-auto pt-1 text-sm font-semibold text-[#ff7a1a]">{formatPrice(item.price)}</p>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {categoryFilter !== 'INTENT_STAY'
              ? exploreRows.map((row) => (
                  <TouristBusinessCarouselSection
                    key={row.id}
                    title={row.title}
                    items={row.items}
                    onOpen={openBusinessPage}
                    fillAvailableWidth={isExploreRailCollapsed}
                  />
                ))
              : null}
          </div>

          <aside className="mt-8 hidden w-full min-w-0 shrink-0 lg:mt-0 lg:block" aria-label="Filters and shortcuts">
            <TouristExploreRightRailSection
              intents={serviceIntents}
              highlightIntentId={intentHighlightId}
              allPartnersActive={categoryFilter === 'ALL'}
              onSelectIntent={setCategoryFilter}
              filterChips={filterChips}
              categoryFilter={categoryFilter}
              onSelectChip={setCategoryFilter}
              showPartnerTypeChips={showPartnerTypeChips}
              isCollapsed={isExploreRailCollapsed}
              onToggleCollapsed={() => setIsExploreRailCollapsed((v) => !v)}
              stayTypeFilter={stayTypeFilter}
              onStayTypeFilterChange={setStayTypeFilter}
              foodMenuCategory={foodMenuCategory}
              onFoodMenuCategoryChange={setFoodMenuCategory}
              foodMenuCategories={menuFeedCategories}
              foodMenuCategoriesLoading={menuFeedLoading}
            />
          </aside>
        </div>
      ) : null}

      {selectedMenuItem ? (
        <TouristMenuItemDetailModal item={selectedMenuItem} onClose={() => setSelectedMenuItem(null)} />
      ) : null}
      <TouristStayPackageDetailModal
        open={Boolean(selectedStayPackage)}
        item={selectedStayPackage}
        onClose={() => setSelectedStayPackage(null)}
        onAddToCart={() => {
          if (!selectedStayPackage) return
          handleAddStayToCart(selectedStayPackage)
        }}
        onBookNow={() => {
          if (!selectedStayPackage) return
          handleBookNowStay(selectedStayPackage)
        }}
      />
    </div>
  )
}

export default Home
