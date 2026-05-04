import express from 'express'
import touristCartItemRouter from './tourist-cart-item/tourist-cart-item.routes.js'
import menuOrderCheckoutRoutes from './menu-order-checkout/menu-order-checkout.routes.js'
import touristCustomerOrdersRoutes from './tourist-customer-orders/tourist-customer-orders.routes.js'
import storeMessagingRoutes from './store-messaging/store-messaging.routes.js'

const touristRoutes = express.Router()

touristRoutes.use('/', touristCartItemRouter)
touristRoutes.use('/', menuOrderCheckoutRoutes)
touristRoutes.use('/', touristCustomerOrdersRoutes)
touristRoutes.use('/', storeMessagingRoutes)

export default touristRoutes
