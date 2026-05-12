import { apiInstance } from '../../api/_base_.js'

export const getMyRestaurantOrderReview = async (orderId) => {
  const id = encodeURIComponent(String(orderId || '').trim())
  return apiInstance.get(`tourist/my-customer-orders/${id}/restaurant-review`)
}

export const putMyRestaurantOrderReview = async (orderId, body) => {
  const id = encodeURIComponent(String(orderId || '').trim())
  return apiInstance.put(`tourist/my-customer-orders/${id}/restaurant-review`, body)
}
