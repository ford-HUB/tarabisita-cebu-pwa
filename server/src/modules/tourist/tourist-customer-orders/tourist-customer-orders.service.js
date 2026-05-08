import {
    createTouristBookingRequestPaymentCheckoutByToken,
    createTouristBookingRequestPaymentCheckout,
    listTouristCustomerOrdersByUserId,
    resolveTouristBookingPaymentLinkByPublicToken,
    resolveTouristBookingPaymentLinkByToken
} from '../../payments/payments.service.js'

export const getMyTouristCustomerOrders = async (userId) => listTouristCustomerOrdersByUserId(userId)
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
