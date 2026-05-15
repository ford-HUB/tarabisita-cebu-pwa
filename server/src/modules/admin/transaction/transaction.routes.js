import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getAdminPlanSubscriptionTransactions,
    getAdminPlanSubscriptionPaymentDetail,
    postAdminPlanSubscriptionPaymentApprove,
    postAdminPlanSubscriptionPaymentReject
} from './transaction.controller.js'
import {
    adminPlanSubscriptionTransactionsQuerySchema,
    adminPlanSubscriptionPaymentIdParamsSchema,
    adminPlanSubscriptionPaymentRejectBodySchema
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

transactionRoutes.post(
    '/plan-subscription-payments/:paymentId/approve',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionPaymentIdParamsSchema),
    postAdminPlanSubscriptionPaymentApprove
)

transactionRoutes.post(
    '/plan-subscription-payments/:paymentId/reject',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionPaymentRejectBodySchema),
    postAdminPlanSubscriptionPaymentReject
)

export default transactionRoutes
