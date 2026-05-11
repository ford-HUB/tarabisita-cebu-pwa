import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    patchMyTouristProfile,
    postMyTouristUploadAvatar,
    postMyTouristChangePassword,
    postRequestTouristEmailChange,
    postResendTouristEmailChange,
    postConfirmTouristEmailChange
} from './tourist-account.controller.js'
import {
    updateTouristProfileSchema,
    uploadTouristAvatarImageSchema,
    changeTouristPasswordSchema,
    requestTouristEmailChangeSchema,
    confirmTouristEmailChangeSchema,
    resendTouristEmailChangeSchema
} from './tourist-account.validator.js'

const touristAccountRoutes = express.Router()

touristAccountRoutes.patch('/profile', guard(['TOURIST']), validateRequest(updateTouristProfileSchema), patchMyTouristProfile)
touristAccountRoutes.post(
    '/avatar',
    guard(['TOURIST']),
    validateRequest(uploadTouristAvatarImageSchema),
    postMyTouristUploadAvatar
)
touristAccountRoutes.post(
    '/change-password',
    guard(['TOURIST']),
    validateRequest(changeTouristPasswordSchema),
    postMyTouristChangePassword
)
touristAccountRoutes.post(
    '/email-change/request',
    guard(['TOURIST']),
    validateRequest(requestTouristEmailChangeSchema),
    postRequestTouristEmailChange
)
touristAccountRoutes.post(
    '/email-change/resend',
    guard(['TOURIST']),
    validateRequest(resendTouristEmailChangeSchema),
    postResendTouristEmailChange
)
touristAccountRoutes.post(
    '/email-change/confirm',
    guard(['TOURIST']),
    validateRequest(confirmTouristEmailChangeSchema),
    postConfirmTouristEmailChange
)

export default touristAccountRoutes
