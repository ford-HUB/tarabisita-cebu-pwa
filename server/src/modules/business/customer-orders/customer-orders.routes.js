import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyCustomerOrders,
    advanceMyCustomerOrderStatus,
    cancelMyCustomerOrder
} from './customer-orders.controller.js'
import { advanceCustomerOrderSchema, cancelCustomerOrderSchema } from './customer-orders.validator.js'

const customerOrdersRoutes = express.Router()

customerOrdersRoutes.get('/me/customer-orders', guard(['BUSINESS']), getMyCustomerOrders)
customerOrdersRoutes.patch(
    '/me/customer-orders/:orderId/advance',
    guard(['BUSINESS']),
    validateRequest(advanceCustomerOrderSchema),
    advanceMyCustomerOrderStatus
)
customerOrdersRoutes.patch(
    '/me/customer-orders/:orderId/cancel',
    guard(['BUSINESS']),
    validateRequest(cancelCustomerOrderSchema),
    cancelMyCustomerOrder
)

export default customerOrdersRoutes
