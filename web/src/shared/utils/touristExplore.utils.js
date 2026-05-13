import { BUSINESS_CATEGORIES } from '../constants/businessCategories.constants.js'
import { TOURIST_SERVICE_INTENTS } from '../constants/touristExploreIntents.constants.js'

const norm = (value) => String(value || '').trim().toLowerCase()

export const categoryDisplayLabel = (category) => {
  if (!category) return 'Other'
  if (typeof category === 'string') return category
  return category.name || 'Other'
}

export const categoryMatchesLabel = (category, label) => {
  const target = norm(label)
  if (!category) return target === norm('Other')
  const name = norm(typeof category === 'string' ? category : category.name)
  if (!name) return target === norm('Other')
  return name === target
}

export const pickHeroBusiness = (businesses) => {
  if (!businesses?.length) return null
  const withVisual = businesses.find((b) => b.banner || b.coverImage || b.logo)
  return withVisual || businesses[0]
}

/** Ordered list for spotlight hero carousel: hero first, then others by profile views. */
export const pickSpotlightHeroBusinesses = (businesses, { max = 8 } = {}) => {
  if (!businesses?.length) return []
  const hero = pickHeroBusiness(businesses)
  const rest = businesses.filter((b) => String(b._id) !== String(hero?._id))
  const byViews = [...rest].sort(
    (a, b) => (b.publicProfileViewCount || 0) - (a.publicProfileViewCount || 0)
  )
  const combined = hero ? [hero, ...byViews] : byViews
  const seen = new Set()
  const out = []
  for (const b of combined) {
    const id = String(b?._id ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(b)
    if (out.length >= max) break
  }
  return out
}

/**
 * Ranks public catalog businesses for marketing (e.g. landing): diners with reviews first, then profile views.
 * @param {unknown[]} businesses
 * @param {{ limit?: number }} [opts]
 */
export const rankPublicBusinessesByRatings = (businesses, { limit = 10 } = {}) => {
  const list = Array.isArray(businesses) ? businesses : []
  if (!list.length) return []

  const rated = []
  const unrated = []
  for (const b of list) {
    const cnt = Number(b?.restaurantReviewSummary?.reviewCount || 0)
    if (cnt > 0) rated.push(b)
    else unrated.push(b)
  }

  const sortRated = (a, b) => {
    const aAvg = Number(a?.restaurantReviewSummary?.averageRating ?? 0)
    const bAvg = Number(b?.restaurantReviewSummary?.averageRating ?? 0)
    if (Number.isFinite(bAvg) && Number.isFinite(aAvg) && bAvg !== aAvg) return bAvg - aAvg
    const ac = Number(a?.restaurantReviewSummary?.reviewCount || 0)
    const bc = Number(b?.restaurantReviewSummary?.reviewCount || 0)
    if (bc !== ac) return bc - ac
    return (Number(b?.publicProfileViewCount) || 0) - (Number(a?.publicProfileViewCount) || 0)
  }

  const sortUnrated = (a, b) =>
    (Number(b?.publicProfileViewCount) || 0) - (Number(a?.publicProfileViewCount) || 0)

  const combined = [...rated.sort(sortRated), ...unrated.sort(sortUnrated)]
  const seen = new Set()
  const out = []
  for (const b of combined) {
    const id = String(b?._id ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(b)
    if (out.length >= limit) break
  }
  return out
}

export const buildExploreRows = (businesses) => {
  if (!businesses?.length) return []

  const rows = []
  const byViews = [...businesses].sort(
    (a, b) => (b.publicProfileViewCount || 0) - (a.publicProfileViewCount || 0)
  )
  rows.push({ id: 'popular-now', title: 'Popular right now', items: byViews })

  for (const { label } of BUSINESS_CATEGORIES) {
    const items = businesses.filter((b) => categoryMatchesLabel(b.category, label))
    if (items.length) {
      rows.push({ id: `cat-${label}`, title: label, items })
    }
  }

  const uncategorized = businesses.filter(
    (b) => !BUSINESS_CATEGORIES.some(({ label }) => categoryMatchesLabel(b.category, label))
  )
  if (uncategorized.length) {
    rows.push({ id: 'cat-more-places', title: 'More places', items: uncategorized })
  }

  return rows
}

export const filterBusinessesByCategoryLabel = (businesses, label) => {
  if (!label || label === 'ALL') return businesses
  return businesses.filter((b) => categoryMatchesLabel(b.category, label))
}

const businessMatchesIntent = (business, intentId) => {
  const intent = TOURIST_SERVICE_INTENTS.find((item) => item.id === intentId)
  if (!intent) return false
  return intent.categoryLabels.some((catLabel) => categoryMatchesLabel(business.category, catLabel))
}

/** If `categoryLabel` belongs to a service intent, return that intent id (for UI highlight). */
export const getServiceIntentIdForCategoryLabel = (categoryLabel) => {
  if (!categoryLabel || categoryLabel === 'ALL') return null
  const match = TOURIST_SERVICE_INTENTS.find((intent) =>
    intent.categoryLabels.some((l) => categoryMatchesLabel(categoryLabel, l))
  )
  return match?.id ?? null
}

/** Supports `ALL`, service intent ids (`INTENT_*`), or a single category display label (e.g. Restaurant). */
export const filterBusinessesByExploreFilter = (businesses, filterId) => {
  if (!filterId || filterId === 'ALL') return businesses
  if (typeof filterId === 'string' && filterId.startsWith('INTENT_')) {
    return businesses.filter((b) => businessMatchesIntent(b, filterId))
  }
  return filterBusinessesByCategoryLabel(businesses, filterId)
}
