import { apiInstance } from '../../api/_base_.js'

export const getMyCustomerRatings = async ({ page, limit, sentiment } = {}) => {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (sentiment) params.sentiment = sentiment
  const response = await apiInstance.get('business/me/customer-ratings', { params })
  return response
}
