import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyBusinessSettings,
    updateMyBusinessSettings,
    verifyMyBusinessPaymentMethod,
    getMyBusinessProfile,
    getMyRestaurantBusinessProfile,
    getMyResortBusinessProfile,
    updateMyResortListingStock,
    updateMyBusinessProfile,
    uploadMyBusinessProfileImage,
    uploadMyBusinessAccountAvatar,
    uploadMyBusinessBannerImage,
    changeMyBusinessPassword,
    submitBusinessProof,
    getMyBusinessActivityLogs,
    createMyBusinessPaymentMethodSetupCheckout
} from './profile.controller.js'
import {
    updateBusinessSettingsSchema,
    verifyBusinessPaymentMethodSchema,
    createBusinessPaymentMethodSetupCheckoutSchema,
    submitBusinessProofSchema,
    updateBusinessProfileSchema,
    uploadBusinessProfileImageSchema,
    uploadBusinessAvatarImageSchema,
    uploadBusinessBannerImageSchema,
    changeBusinessPasswordSchema,
    updateResortListingStockSchema
} from './profile.validator.js'

const profileRoutes = express.Router()

profileRoutes.get('/me/settings', guard(['BUSINESS']), getMyBusinessSettings)
profileRoutes.put('/me/settings', guard(['BUSINESS']), validateRequest(updateBusinessSettingsSchema), updateMyBusinessSettings)
profileRoutes.post(
    '/me/settings/payment-methods/verify',
    guard(['BUSINESS']),
    validateRequest(verifyBusinessPaymentMethodSchema),
    verifyMyBusinessPaymentMethod
)
profileRoutes.post(
    '/me/settings/payment-methods/setup-checkout',
    guard(['BUSINESS']),
    validateRequest(createBusinessPaymentMethodSetupCheckoutSchema),
    createMyBusinessPaymentMethodSetupCheckout
)
profileRoutes.get('/me/restaurant', guard(['BUSINESS']), getMyRestaurantBusinessProfile)
profileRoutes.get('/me/resort', guard(['BUSINESS']), getMyResortBusinessProfile)
profileRoutes.patch('/me/resort/listings/:menuItemId/stock', guard(['BUSINESS']), validateRequest(updateResortListingStockSchema), updateMyResortListingStock)
profileRoutes.get('/me', guard(['BUSINESS']), getMyBusinessProfile)
profileRoutes.get('/me/activity-logs', guard(['BUSINESS']), getMyBusinessActivityLogs)
profileRoutes.put('/me', guard(['BUSINESS']), validateRequest(updateBusinessProfileSchema), updateMyBusinessProfile)
profileRoutes.post('/me/profile-image', guard(['BUSINESS']), validateRequest(uploadBusinessProfileImageSchema), uploadMyBusinessProfileImage)
profileRoutes.post('/me/avatar', guard(['BUSINESS']), validateRequest(uploadBusinessAvatarImageSchema), uploadMyBusinessAccountAvatar)
profileRoutes.post('/me/banner-image', guard(['BUSINESS']), validateRequest(uploadBusinessBannerImageSchema), uploadMyBusinessBannerImage)
profileRoutes.post('/me/change-password', guard(['BUSINESS']), validateRequest(changeBusinessPasswordSchema), changeMyBusinessPassword)
profileRoutes.post('/submit-proof', guard(['BUSINESS']), validateRequest(submitBusinessProofSchema), submitBusinessProof)

export default profileRoutes
