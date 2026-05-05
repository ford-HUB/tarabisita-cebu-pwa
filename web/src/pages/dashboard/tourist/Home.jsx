import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTouristExplore } from '../../../hooks/useTouristExplore.hook'
import { useTouristExploreMenuDeepLink } from '../../../hooks/useTouristExploreMenuDeepLink.hook'
import { buildTouristExploreBusinessDetailHref } from '../../../components/layout/tourist/touristLayout.constants.js'
import { recordPublicBusinessView } from '../../../services/tourist/touristExplore.service.js'
import TouristExploreHeroSection from '../../../components/tourist/explore/sections/TouristExploreHeroSection'
import TouristExploreIntentsSection from '../../../components/tourist/explore/sections/TouristExploreIntentsSection'
import TouristCategoryChipsSection from '../../../components/tourist/explore/sections/TouristCategoryChipsSection'
import TouristBusinessCarouselSection from '../../../components/tourist/explore/sections/TouristBusinessCarouselSection'
import TouristExploreLoadingSection from '../../../components/tourist/explore/sections/TouristExploreLoadingSection'
import TouristMenuItemDetailModal from '../../../components/tourist/explore/modals/TouristMenuItemDetailModal'
import TouristExploreRightRailSection from '../../../components/tourist/explore/sections/TouristExploreRightRailSection'
import TouristExploreFoodMenuSection from '../../../components/tourist/explore/sections/TouristExploreFoodMenuSection'

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
  const [isExploreRailCollapsed, setIsExploreRailCollapsed] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)

  useTouristExploreMenuDeepLink(setSelectedMenuItem)

  const openBusinessPage = (business) => {
    const id = String(business?._id || '').trim()
    if (!id) return
    void recordPublicBusinessView(id).catch(() => {})
    navigate(buildTouristExploreBusinessDetailHref(id))
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
              <section className="rounded-2xl border border-[#e7dfd5] bg-gradient-to-r from-[#9b5a2c] to-[#ff7a1a] p-6 text-white shadow-sm md:p-8">
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

            {exploreRows.map((row) => (
              <TouristBusinessCarouselSection key={row.id} title={row.title} items={row.items} onOpen={openBusinessPage} />
            ))}
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
    </div>
  )
}

export default Home
