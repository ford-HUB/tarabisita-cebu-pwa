import express from 'express'
import publicCatalogRoutes from './public-catalog/public-catalog.routes.js'
import profileRoutes from './profile/profile.routes.js'
import menuRoutes from './menu/menu.routes.js'
import billingRoutes from './billing/billing.routes.js'
import manageBusinessRoutes from './manage-business/manage-business.routes.js'
import customerOrdersRoutes from './customer-orders/customer-orders.routes.js'
import businessStoreMessagingRoutes from './store-messaging/store-messaging.routes.js'
import dailySalesReportRoutes from './daily-sales-report/daily-sales-report.routes.js'
import trafficInsightsRoutes from './traffic-insights/traffic-insights.routes.js'

const businessRoutes = express.Router()

businessRoutes.use(publicCatalogRoutes)
businessRoutes.use(profileRoutes)
businessRoutes.use(menuRoutes)
businessRoutes.use(billingRoutes)
businessRoutes.use(manageBusinessRoutes)
businessRoutes.use(customerOrdersRoutes)
businessRoutes.use(businessStoreMessagingRoutes)
businessRoutes.use(dailySalesReportRoutes)
businessRoutes.use(trafficInsightsRoutes)

export default businessRoutes
