import { apiInstance } from '../../api/_base_.js'

export const getMyCustomerOrders = async () => {
  const response = await apiInstance.get('business/me/customer-orders')
  return response
}

export const getMyResortBookingRecords = async () => {
  const response = await apiInstance.get('business/me/resort/booking-records')
  return response
}

export const advanceMyCustomerOrder = async (orderId) => {
  const response = await apiInstance.patch(`business/me/customer-orders/${encodeURIComponent(orderId)}/advance`)
  return response
}

export const advanceMyResortBookingRecord = async (orderId) => {
  const response = await apiInstance.patch(
    `business/me/resort/booking-records/${encodeURIComponent(orderId)}/advance`
  )
  return response
}

export const cancelMyCustomerOrder = async (orderId, cancelReason) => {
  const response = await apiInstance.patch(`business/me/customer-orders/${encodeURIComponent(orderId)}/cancel`, {
    cancelReason: cancelReason || ''
  })
  return response
}

export const cancelMyResortBookingRecord = async (orderId, cancelReason) => {
  const response = await apiInstance.patch(
    `business/me/resort/booking-records/${encodeURIComponent(orderId)}/cancel`,
    {
      cancelReason: cancelReason || ''
    }
  )
  return response
}
