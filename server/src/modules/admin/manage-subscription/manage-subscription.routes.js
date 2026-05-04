import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { putManageSubscriptionBodySchema } from './manage-subscription.validator.js'
import { putManageSubscriptionCatalog } from './manage-subscription.controller.js'

const manageSubscriptionRoutes = express.Router()

manageSubscriptionRoutes.put(
    '/catalog',
    guard(['ADMIN']),
    validateRequest(putManageSubscriptionBodySchema),
    putManageSubscriptionCatalog
)

export default manageSubscriptionRoutes
