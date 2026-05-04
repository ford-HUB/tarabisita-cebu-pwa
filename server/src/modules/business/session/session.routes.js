import express from 'express'
import {
    register,
    login,
    logout,
    sendVerificationCode,
    resendVerificationCode,
    verifyCode,
    sendRequestedResetPassword,
    resetPassword,
    internalEmailChecker,
    checkUser
} from './session.controller.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    loginSchema,
    registerSchema,
    sendOrResetOrMailCheckerVerificationCodeSchema,
    resendVerificationCodeSchema,
    verifyCodeSchema,
    resetPasswordSchema
} from './user.validator.js'
import { guard } from '../../../shared/middlewares/guard.js'

const sessionRoutes = express.Router()

sessionRoutes.post('/register', validateRequest(registerSchema), register)
sessionRoutes.post('/login', validateRequest(loginSchema), login)
sessionRoutes.post('/send-verification', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), sendVerificationCode)
sessionRoutes.post('/resend-verification', validateRequest(resendVerificationCodeSchema), resendVerificationCode)
sessionRoutes.post('/verify-code', validateRequest(verifyCodeSchema), verifyCode)
sessionRoutes.post('/request-reset-password', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), sendRequestedResetPassword)
sessionRoutes.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword)
sessionRoutes.post('/mail-checker', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), internalEmailChecker)
sessionRoutes.get('/check-user', guard(['TOURIST', 'BUSINESS', 'ADMIN']), checkUser)
sessionRoutes.post('/logout', guard(['TOURIST', 'BUSINESS', 'ADMIN']), logout)

export default sessionRoutes
