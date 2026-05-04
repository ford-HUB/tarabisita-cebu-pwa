import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { getMyMenuOrderCheckoutStatus } from './menu-order-checkout.controller.js'
import { menuOrderCheckoutPendingParamsSchema } from './menu-order-checkout.validator.js'

const menuOrderCheckoutRoutes = express.Router()

menuOrderCheckoutRoutes.get(
    '/menu-order-checkout/:pendingId/status',
    guard(['TOURIST']),
    validateRequest(menuOrderCheckoutPendingParamsSchema),
    getMyMenuOrderCheckoutStatus
)

export default menuOrderCheckoutRoutes
