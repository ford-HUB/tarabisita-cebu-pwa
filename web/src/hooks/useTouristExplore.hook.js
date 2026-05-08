import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from './useAuth.hook'
import { useTouristExploreStore } from '../store/tourist/touristExplore.store'
import {
  buildExploreRows,
  categoryMatchesLabel,
  filterBusinessesByExploreFilter,
  getServiceIntentIdForCategoryLabel,
  pickSpotlightHeroBusinesses
} from '../shared/utils/touristExplore.utils.js'
import { BUSINESS_CATEGORIES } from '../shared/constants/businessCategories.constants.js'
import { TOURIST_SERVICE_INTENTS } from '../shared/constants/touristExploreIntents.constants.js'

export const useTouristExplore = () => {
  const { user } = useAuth()
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [foodMenuCategory, setFoodMenuCategory] = useState('ALL')
  const [stayTypeFilter, setStayTypeFilter] = useState('ALL')

  const {
    businesses,
    isLoading,
    errorMessage,
    loadPublicBusinesses,
    recordView,
    menuFeedItems,
    menuFeedCategories,
    menuFeedLoading,
    menuFeedError,
    loadMenuFeed
  } = useTouristExploreStore(
    useShallow((s) => ({
      businesses: s.businesses,
      isLoading: s.isLoading,
      errorMessage: s.errorMessage,
      loadPublicBusinesses: s.loadPublicBusinesses,
      recordView: s.recordView,
      menuFeedItems: s.menuFeedItems,
      menuFeedCategories: s.menuFeedCategories,
      menuFeedLoading: s.menuFeedLoading,
      menuFeedError: s.menuFeedError,
      loadMenuFeed: s.loadMenuFeed
    }))
  )

  useEffect(() => {
    loadPublicBusinesses()
  }, [loadPublicBusinesses])

  useEffect(() => {
    if (categoryFilter !== 'INTENT_FOOD') {
      setFoodMenuCategory('ALL')
    }
  }, [categoryFilter])

  useEffect(() => {
    if (categoryFilter !== 'INTENT_STAY') {
      setStayTypeFilter('ALL')
    }
  }, [categoryFilter])

  useEffect(() => {
    if (categoryFilter !== 'INTENT_FOOD') return
    void loadMenuFeed(foodMenuCategory)
  }, [categoryFilter, foodMenuCategory, loadMenuFeed])

  const filteredBusinesses = useMemo(() => {
    const baseRows = filterBusinessesByExploreFilter(businesses, categoryFilter)
    if (categoryFilter !== 'INTENT_STAY' || stayTypeFilter === 'ALL') {
      return baseRows
    }
    return baseRows.filter((business) => categoryMatchesLabel(business?.category, stayTypeFilter))
  }, [businesses, categoryFilter, stayTypeFilter])

  const heroSpotlightBusinesses = useMemo(
    () => pickSpotlightHeroBusinesses(filteredBusinesses, { max: 8 }),
    [filteredBusinesses]
  )

  const exploreRows = useMemo(() => buildExploreRows(filteredBusinesses), [filteredBusinesses])

  const filterChips = useMemo(() => {
    const chips = [{ id: 'ALL', label: 'All' }]
    for (const { label } of BUSINESS_CATEGORIES) {
      const count = businesses.filter((b) => categoryMatchesLabel(b.category, label)).length
      if (count > 0) chips.push({ id: label, label })
    }
    return chips
  }, [businesses])

  const serviceIntents = useMemo(
    () =>
      TOURIST_SERVICE_INTENTS.map((intent) => ({
        ...intent,
        count: businesses.filter((b) =>
          intent.categoryLabels.some((l) => categoryMatchesLabel(b.category, l))
        ).length
      })),
    [businesses]
  )

  const intentHighlightId = useMemo(() => {
    if (categoryFilter === 'ALL' || !categoryFilter) return null
    if (typeof categoryFilter === 'string' && categoryFilter.startsWith('INTENT_')) return categoryFilter
    return getServiceIntentIdForCategoryLabel(categoryFilter)
  }, [categoryFilter])

  const showPartnerTypeChips = useMemo(
    () => typeof categoryFilter !== 'string' || !categoryFilter.startsWith('INTENT_'),
    [categoryFilter]
  )

  const openBusiness = useCallback(
    (business) => {
      if (!business?._id) return
      setSelectedBusiness(business)
      void recordView(business._id)
    },
    [recordView]
  )

  const openBusinessById = useCallback(
    (businessId) => {
      if (!businessId) return
      const business = businesses.find((b) => String(b._id) === String(businessId))
      if (business) openBusiness(business)
    },
    [businesses, openBusiness]
  )

  const closeBusiness = useCallback(() => setSelectedBusiness(null), [])

  return {
    user,
    businesses,
    filteredBusinesses,
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
    selectedBusiness,
    openBusiness,
    openBusinessById,
    closeBusiness,
    isLoading,
    errorMessage,
    reload: loadPublicBusinesses
  }
}
