import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyTouristCustomerOrdersHandler,
    postBookingPaymentLinkCheckoutPublicHandler,
    postBookingPaymentLinkResolvePublicHandler,
    postMyBookingPaymentLinkCheckoutHandler,
    postMyBookingPaymentLinkResolveHandler,
    postMyBookingRequestPaymentCheckoutHandler
} from './tourist-customer-orders.controller.js'
import {
    bookingPaymentLinkCheckoutSchema,
    bookingPaymentLinkResolveSchema,
    bookingRequestPaymentCheckoutSchema
} from './tourist-customer-orders.validator.js'

const touristCustomerOrdersRoutes = express.Router()

touristCustomerOrdersRoutes.get('/my-customer-orders', guard(['TOURIST']), getMyTouristCustomerOrdersHandler)
touristCustomerOrdersRoutes.post(
    '/my-customer-orders/:orderId/booking-payment-checkout',
    guard(['TOURIST']),
    validateRequest(bookingRequestPaymentCheckoutSchema),
    postMyBookingRequestPaymentCheckoutHandler
)
touristCustomerOrdersRoutes.post(
    '/my-customer-orders/booking-payment-link/resolve',
    guard(['TOURIST']),
    validateRequest(bookingPaymentLinkResolveSchema),
    postMyBookingPaymentLinkResolveHandler
)
touristCustomerOrdersRoutes.post(
    '/my-customer-orders/booking-payment-link/checkout',
    guard(['TOURIST']),
    validateRequest(bookingPaymentLinkCheckoutSchema),
    postMyBookingPaymentLinkCheckoutHandler
)
touristCustomerOrdersRoutes.post(
    '/booking-payment-link/public/resolve',
    validateRequest(bookingPaymentLinkResolveSchema),
    postBookingPaymentLinkResolvePublicHandler
)
touristCustomerOrdersRoutes.post(
    '/booking-payment-link/public/checkout',
    validateRequest(bookingPaymentLinkCheckoutSchema),
    postBookingPaymentLinkCheckoutPublicHandler
)

export default touristCustomerOrdersRoutes
