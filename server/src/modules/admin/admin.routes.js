import express from 'express'
import manageSubscriptionRoutes from './manage-subscription/manage-subscription.routes.js'
import manageUsersRoutes from './manage-users/manage-users.routes.js'
import transactionRoutes from './transaction/transaction.routes.js'

const adminRoutes = express.Router()

adminRoutes.use('/manage-subscription', manageSubscriptionRoutes)
adminRoutes.use('/manage-users', manageUsersRoutes)
adminRoutes.use('/transaction', transactionRoutes)

export default adminRoutes
