import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { getManageSubscriptionCatalog } from '../../admin/manage-subscription/manage-subscription.controller.js'
import {
    getPublicMenuFeed,
    postTouristCustomerOrder,
    postTouristCustomerOrderCheckout,
    getPublicBusinesses,
    recordPublicBusinessView,
    getBusinessById
} from './public-catalog.controller.js'
import {
    createTouristCustomerOrderSchema,
    createTouristCustomerOrderCheckoutSchema
} from './public-catalog.validator.js'

const publicCatalogRoutes = express.Router()

publicCatalogRoutes.get('/public', getPublicBusinesses)
publicCatalogRoutes.get('/public/menu-feed', guard(['TOURIST']), getPublicMenuFeed)
publicCatalogRoutes.post(
    '/public/:businessId/customer-order',
    guard(['TOURIST']),
    validateRequest(createTouristCustomerOrderSchema),
    postTouristCustomerOrder
)
publicCatalogRoutes.post(
    '/public/:businessId/customer-order/checkout',
    guard(['TOURIST']),
    validateRequest(createTouristCustomerOrderCheckoutSchema),
    postTouristCustomerOrderCheckout
)
publicCatalogRoutes.post('/public/:businessId/view', recordPublicBusinessView)
publicCatalogRoutes.get('/public/:businessId', getBusinessById)
publicCatalogRoutes.get('/subscription-catalog', getManageSubscriptionCatalog)

export default publicCatalogRoutes
