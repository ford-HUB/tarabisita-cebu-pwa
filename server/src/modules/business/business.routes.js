import express from 'express'
import publicCatalogRoutes from './public-catalog/public-catalog.routes.js'
import profileRoutes from './profile/profile.routes.js'
import menuRoutes from './menu/menu.routes.js'
import billingRoutes from './billing/billing.routes.js'
import manageBusinessRoutes from './manage-business/manage-business.routes.js'
import customerOrdersRoutes from './customer-orders/customer-orders.routes.js'
import businessStoreMessagingRoutes from './store-messaging/store-messaging.routes.js'

const businessRoutes = express.Router()

businessRoutes.use(publicCatalogRoutes)
businessRoutes.use(profileRoutes)
businessRoutes.use(menuRoutes)
businessRoutes.use(billingRoutes)
businessRoutes.use(manageBusinessRoutes)
businessRoutes.use(customerOrdersRoutes)
businessRoutes.use(businessStoreMessagingRoutes)

export default businessRoutes
