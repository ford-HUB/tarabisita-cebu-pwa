import express from 'express'
import {
    handlePaymongoCheckoutWebhook,
    registerPaymongoWebhookEndpoint,
    createMyBusinessBillingCheckout,
    createMyBusinessMenuItem,
    deleteMyBusinessMenuItem,
    changeMyBusinessPassword,
    getBusinessApprovalQueue,
    getAdminPlanSubscriptionTransactions,
    getBusinessPartners,
    getBusinessById,
    getMyBusinessActivityLogs,
    getMyBusinessBillingLedger,
    getMyBusinessMenuItems,
    getMyBusinessProfile,
    getPublicBusinesses,
    submitBusinessProof,
    restoreMyBusinessMenuItem,
    updateMyBusinessMenuItem,
    updateMyBusinessMenuItemStock,
    updateMyBusinessThemeColor,
    updateBusinessApprovalStatus,
    updateMyBusinessProfile,
    uploadMyBusinessAccountAvatar,
    uploadMyBusinessBannerImage,
    uploadMyBusinessProfileImage
} from './business.controller.js'
import { guard } from '../shared/middlewares/guard.js'
import { validateRequest } from '../shared/middlewares/validateRequest.js'
import { getSubscriptionCatalog, putAdminSubscriptionCatalog } from '../subscriptionCatalog/subscriptionCatalog.controller.js'
import { subscriptionCatalogPutSchema } from '../shared/validators/subscriptionCatalog.validator.js'
import {
    changeBusinessPasswordSchema,
    createBusinessBillingCheckoutSchema,
    createBusinessMenuItemSchema,
    deleteBusinessMenuItemSchema,
    restoreBusinessMenuItemSchema,
    submitBusinessProofSchema,
    updateBusinessMenuItemSchema,
    updateBusinessMenuItemStockSchema,
    updateBusinessThemeColorSchema,
    uploadBusinessAvatarImageSchema,
    updateBusinessProfileSchema,
    uploadBusinessBannerImageSchema,
    uploadBusinessProfileImageSchema
    ,
    registerPaymongoWebhookSchema,
    adminPlanSubscriptionTransactionsQuerySchema
} from '../shared/validators/business.validator.js'

const businessRoutes = express.Router()

businessRoutes.post('/webhooks/paymongo', handlePaymongoCheckoutWebhook)
businessRoutes.post('/webhooks/maya', handlePaymongoCheckoutWebhook)
businessRoutes.post('/webhooks/paymongo/register', guard(['BUSINESS', 'ADMIN']), validateRequest(registerPaymongoWebhookSchema), registerPaymongoWebhookEndpoint)
businessRoutes.get('/public', getPublicBusinesses)
businessRoutes.get('/public/:businessId', getBusinessById)
businessRoutes.get('/subscription-catalog', getSubscriptionCatalog)
businessRoutes.get('/me', guard(['BUSINESS']), getMyBusinessProfile)
businessRoutes.get('/me/billing/ledger', guard(['BUSINESS']), getMyBusinessBillingLedger)
businessRoutes.get('/me/activity-logs', guard(['BUSINESS']), getMyBusinessActivityLogs)
businessRoutes.put('/me', guard(['BUSINESS']), validateRequest(updateBusinessProfileSchema), updateMyBusinessProfile)
businessRoutes.patch('/me/theme-color', guard(['BUSINESS']), validateRequest(updateBusinessThemeColorSchema), updateMyBusinessThemeColor)
businessRoutes.post('/me/profile-image', guard(['BUSINESS']), validateRequest(uploadBusinessProfileImageSchema), uploadMyBusinessProfileImage)
businessRoutes.post('/me/avatar', guard(['BUSINESS']), validateRequest(uploadBusinessAvatarImageSchema), uploadMyBusinessAccountAvatar)
businessRoutes.post('/me/banner-image', guard(['BUSINESS']), validateRequest(uploadBusinessBannerImageSchema), uploadMyBusinessBannerImage)
businessRoutes.get('/me/menu-items', guard(['BUSINESS']), getMyBusinessMenuItems)
businessRoutes.post('/me/menu-items', guard(['BUSINESS']), validateRequest(createBusinessMenuItemSchema), createMyBusinessMenuItem)
businessRoutes.delete('/me/menu-items/:menuItemId', guard(['BUSINESS']), validateRequest(deleteBusinessMenuItemSchema), deleteMyBusinessMenuItem)
businessRoutes.patch('/me/menu-items/:menuItemId', guard(['BUSINESS']), validateRequest(updateBusinessMenuItemSchema), updateMyBusinessMenuItem)
businessRoutes.patch('/me/menu-items/:menuItemId/stock', guard(['BUSINESS']), validateRequest(updateBusinessMenuItemStockSchema), updateMyBusinessMenuItemStock)
businessRoutes.patch('/me/menu-items/:menuItemId/restore', guard(['BUSINESS']), validateRequest(restoreBusinessMenuItemSchema), restoreMyBusinessMenuItem)
businessRoutes.post('/me/change-password', guard(['BUSINESS']), validateRequest(changeBusinessPasswordSchema), changeMyBusinessPassword)
businessRoutes.post('/submit-proof', guard(['BUSINESS']), validateRequest(submitBusinessProofSchema), submitBusinessProof)
businessRoutes.post('/me/billing/checkout', guard(['BUSINESS']), validateRequest(createBusinessBillingCheckoutSchema), createMyBusinessBillingCheckout)
businessRoutes.get('/admin/approval-queue', guard(['ADMIN']), getBusinessApprovalQueue)
businessRoutes.get(
    '/admin/plan-subscription-transactions',
    guard(['ADMIN']),
    validateRequest(adminPlanSubscriptionTransactionsQuerySchema),
    getAdminPlanSubscriptionTransactions
)
businessRoutes.get('/admin/partners', guard(['ADMIN']), getBusinessPartners)
businessRoutes.put(
    '/admin/subscription-catalog',
    guard(['ADMIN']),
    validateRequest(subscriptionCatalogPutSchema),
    putAdminSubscriptionCatalog
)
businessRoutes.patch('/admin/approval-queue/:businessId', guard(['ADMIN']), updateBusinessApprovalStatus)

export default businessRoutes

