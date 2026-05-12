import {
    createTouristBookingRequestPaymentCheckoutByToken,
    createTouristBookingRequestPaymentCheckout,
    listTouristCustomerOrdersByUserId,
    resolveTouristBookingPaymentLinkByPublicToken,
    resolveTouristBookingPaymentLinkByToken
} from '../../payments/payments.service.js'
import { mergeRestaurantReviewFlagsOntoOrders } from '../restaurant-order-reviews/restaurant-order-reviews.service.js'

export const getMyTouristCustomerOrders = async (userId) => {
    const orders = await listTouristCustomerOrdersByUserId(userId)
    return mergeRestaurantReviewFlagsOntoOrders(orders)
}
export const createMyBookingRequestPaymentCheckout = async ({
    userId,
    customerOrderId,
    returnBaseUrl,
    paymentMethod
}) =>
    createTouristBookingRequestPaymentCheckout({ userId, customerOrderId, returnBaseUrl, paymentMethod })
export const resolveMyBookingPaymentLink = async ({ userId, paymentToken }) =>
    resolveTouristBookingPaymentLinkByToken({ userId, paymentToken })
export const createMyBookingPaymentCheckoutByToken = async ({
    userId,
    paymentToken,
    returnBaseUrl,
    paymentMethod
}) =>
    createTouristBookingRequestPaymentCheckoutByToken({ userId, paymentToken, returnBaseUrl, paymentMethod })
export const resolveBookingPaymentLinkPublic = async ({ paymentToken }) =>
    resolveTouristBookingPaymentLinkByPublicToken({ paymentToken })
export const createBookingPaymentCheckoutPublicByToken = async ({ paymentToken, returnBaseUrl, paymentMethod }) =>
    createTouristBookingRequestPaymentCheckoutByToken({ paymentToken, returnBaseUrl, paymentMethod })
