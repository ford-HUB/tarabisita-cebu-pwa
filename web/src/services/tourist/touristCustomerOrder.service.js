import { apiInstance } from '../../api/_base_.js'

export const postTouristCustomerOrder = async (businessId, body) => {
  const response = await apiInstance.post(`business/public/${businessId}/customer-order`, body)
  return response
}

/** Start PayMongo prepayment for one restaurant; order is created after payment succeeds. */
export const postTouristCustomerOrderCheckout = async (businessId, body) => {
  const response = await apiInstance.post(`business/public/${businessId}/customer-order/checkout`, body)
  return response
}

export const getTouristMenuOrderCheckoutStatus = async (pendingId) => {
  const response = await apiInstance.get(
    `tourist/menu-order-checkout/${encodeURIComponent(pendingId)}/status`
  )
  return response
}

/** Authenticated tourist: menu orders tied to your account (status updates when the restaurant advances the order). */
export const getMyTouristCustomerOrders = async () => {
  const response = await apiInstance.get('tourist/my-customer-orders')
  return response
}
