import { apiInstance } from '../../api/_base_.js'

export const getMyCustomerOrders = async () => {
  const response = await apiInstance.get('business/me/customer-orders')
  return response
}

export const advanceMyCustomerOrder = async (orderId) => {
  const response = await apiInstance.patch(`business/me/customer-orders/${encodeURIComponent(orderId)}/advance`)
  return response
}

export const cancelMyCustomerOrder = async (orderId, cancelReason) => {
  const response = await apiInstance.patch(`business/me/customer-orders/${encodeURIComponent(orderId)}/cancel`, {
    cancelReason: cancelReason || ''
  })
  return response
}
