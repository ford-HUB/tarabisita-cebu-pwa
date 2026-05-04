import { listTouristCustomerOrdersByUserId } from '../../payments/payments.service.js'

export const getMyTouristCustomerOrders = async (userId) => listTouristCustomerOrdersByUserId(userId)
