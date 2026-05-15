import express from 'express'
import adminAccountRoutes from './admin-account/admin-account.routes.js'
import manageSubscriptionRoutes from './manage-subscription/manage-subscription.routes.js'
import manageUsersRoutes from './manage-users/manage-users.routes.js'
import transactionRoutes from './transaction/transaction.routes.js'
import systemPerformanceRoutes from './system-performance/system-performance.routes.js'

const adminRoutes = express.Router()

adminRoutes.use('/account', adminAccountRoutes)
adminRoutes.use('/manage-subscription', manageSubscriptionRoutes)
adminRoutes.use('/manage-users', manageUsersRoutes)
adminRoutes.use('/transaction', transactionRoutes)
adminRoutes.use('/system-performance', systemPerformanceRoutes)

export default adminRoutes
