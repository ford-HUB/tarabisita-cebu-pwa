import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyTouristCustomerOrdersHandler,
    postBookingPaymentLinkCheckoutPublicHandler,
    postBookingPaymentLinkResolvePublicHandler,
    postMyBookingPaymentLinkCheckoutHandler,
    postMyBookingPaymentLinkResolveHandler,
    postMyBookingRequestPaymentCheckoutHandler,
    getMyRestaurantOrderReviewHandler,
    putMyRestaurantOrderReviewHandler
} from './tourist-customer-orders.controller.js'
import {
    bookingPaymentLinkCheckoutSchema,
    bookingPaymentLinkResolveSchema,
    bookingRequestPaymentCheckoutSchema,
    restaurantOrderReviewParamsSchema,
    restaurantOrderReviewUpsertBodySchema
} from './tourist-customer-orders.validator.js'

const touristCustomerOrdersRoutes = express.Router()

touristCustomerOrdersRoutes.get('/my-customer-orders', guard(['TOURIST']), getMyTouristCustomerOrdersHandler)
touristCustomerOrdersRoutes.get(
    '/my-customer-orders/:orderId/restaurant-review',
    guard(['TOURIST']),
    validateRequest(restaurantOrderReviewParamsSchema),
    getMyRestaurantOrderReviewHandler
)
touristCustomerOrdersRoutes.put(
    '/my-customer-orders/:orderId/restaurant-review',
    guard(['TOURIST']),
    validateRequest(restaurantOrderReviewUpsertBodySchema),
    putMyRestaurantOrderReviewHandler
)
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
