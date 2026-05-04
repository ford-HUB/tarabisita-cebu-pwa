import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyBusinessProfile,
    updateMyBusinessProfile,
    uploadMyBusinessProfileImage,
    uploadMyBusinessAccountAvatar,
    uploadMyBusinessBannerImage,
    updateMyBusinessThemeColor,
    changeMyBusinessPassword,
    submitBusinessProof,
    getMyBusinessActivityLogs
} from './profile.controller.js'
import {
    submitBusinessProofSchema,
    updateBusinessProfileSchema,
    updateBusinessThemeColorSchema,
    uploadBusinessProfileImageSchema,
    uploadBusinessAvatarImageSchema,
    uploadBusinessBannerImageSchema,
    changeBusinessPasswordSchema
} from './profile.validator.js'

const profileRoutes = express.Router()

profileRoutes.get('/me', guard(['BUSINESS']), getMyBusinessProfile)
profileRoutes.get('/me/activity-logs', guard(['BUSINESS']), getMyBusinessActivityLogs)
profileRoutes.put('/me', guard(['BUSINESS']), validateRequest(updateBusinessProfileSchema), updateMyBusinessProfile)
profileRoutes.patch('/me/theme-color', guard(['BUSINESS']), validateRequest(updateBusinessThemeColorSchema), updateMyBusinessThemeColor)
profileRoutes.post('/me/profile-image', guard(['BUSINESS']), validateRequest(uploadBusinessProfileImageSchema), uploadMyBusinessProfileImage)
profileRoutes.post('/me/avatar', guard(['BUSINESS']), validateRequest(uploadBusinessAvatarImageSchema), uploadMyBusinessAccountAvatar)
profileRoutes.post('/me/banner-image', guard(['BUSINESS']), validateRequest(uploadBusinessBannerImageSchema), uploadMyBusinessBannerImage)
profileRoutes.post('/me/change-password', guard(['BUSINESS']), validateRequest(changeBusinessPasswordSchema), changeMyBusinessPassword)
profileRoutes.post('/submit-proof', guard(['BUSINESS']), validateRequest(submitBusinessProofSchema), submitBusinessProof)

export default profileRoutes
