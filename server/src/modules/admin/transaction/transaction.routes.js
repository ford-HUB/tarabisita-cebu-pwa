import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getAdminPlanSubscriptionTransactions,
    getAdminPlanSubscriptionPaymentDetail
} from './transaction.controller.js'
import {
    adminPlanSubscriptionTransactionsQuerySchema,
    adminPlanSubscriptionPaymentIdParamsSchema
} from './transaction.validator.js'

const transactionRoutes = express.Router()

transactionRoutes.get(
    '/plan-subscription-transactions',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionTransactionsQuerySchema),
    getAdminPlanSubscriptionTransactions
)

transactionRoutes.get(
    '/plan-subscription-payments/:paymentId',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionPaymentIdParamsSchema),
    getAdminPlanSubscriptionPaymentDetail
)

export default transactionRoutes
