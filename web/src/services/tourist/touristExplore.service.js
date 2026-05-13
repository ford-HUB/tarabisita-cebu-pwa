import { apiInstance } from '../../api/_base_.js'

export const fetchPublicBusinesses = async () => {
  const response = await apiInstance.get('business/public')
  return response
}

export const fetchPublicBusinessById = async (businessId) => {
  const response = await apiInstance.get(`business/public/${businessId}`)
  return response
}

/** @param {Record<string, string|number|undefined>} [params] sort, rating, page, limit */
export const fetchPublicBusinessRestaurantReviews = async (businessId, params = {}) => {
  const id = encodeURIComponent(String(businessId || '').trim())
  const response = await apiInstance.get(`business/public/${id}/restaurant-reviews`, { params })
  return response
}

/** Public landing testimonials: recent reviews across verified, subscribed businesses. */
export const fetchPublicLandingRestaurantReviews = async ({ limit } = {}) => {
  const params = {}
  if (limit != null) params.limit = limit
  const response = await apiInstance.get('business/public/landing-restaurant-reviews', { params })
  return response
}

export const recordPublicBusinessView = async (businessId) => {
  const response = await apiInstance.post(`business/public/${businessId}/view`)
  return response
}

/** @param {string} [menuCategory] Use `ALL` for every food type, or a menu item category label. */
export const fetchPublicMenuFeed = async (menuCategory = 'ALL') => {
  const response = await apiInstance.get('business/public/menu-feed', {
    params: { menuCategory }
  })
  return response
}

/**
 * Gemini-backed relevance ranking for tourist catalog search (API key stays on the server).
 * @param {{ query: string, items: { name?: string, category?: string, businessName?: string }[] }} body
 */
export const postTouristCatalogSearchRank = async (body) => {
  const response = await apiInstance.post('business/public/tourist-catalog-search-rank', body)
  return response
}
