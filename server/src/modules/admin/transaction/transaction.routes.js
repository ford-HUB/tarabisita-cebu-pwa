import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { getAdminPlanSubscriptionTransactions } from './transaction.controller.js'
import { adminPlanSubscriptionTransactionsQuerySchema } from './transaction.validator.js'

const transactionRoutes = express.Router()

transactionRoutes.get(
    '/plan-subscription-transactions',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionTransactionsQuerySchema),
    getAdminPlanSubscriptionTransactions
)

export default transactionRoutes
