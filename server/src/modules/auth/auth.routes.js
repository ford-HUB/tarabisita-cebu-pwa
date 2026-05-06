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
} from './auth.controller.js'
import { validateRequest } from '../../shared/middlewares/validateRequest.js'
import {
    loginSchema,
    registerSchema,
    sendOrResetOrMailCheckerVerificationCodeSchema,
    resendVerificationCodeSchema,
    verifyCodeSchema,
    resetPasswordSchema
} from './auth.validator.js'
import { guard } from '../../shared/middlewares/guard.js'

const authRoutes = express.Router()

authRoutes.post('/register', validateRequest(registerSchema), register)
authRoutes.post('/login', validateRequest(loginSchema), login)
authRoutes.post('/send-verification', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), sendVerificationCode)
authRoutes.post('/resend-verification', validateRequest(resendVerificationCodeSchema), resendVerificationCode)
authRoutes.post('/verify-code', validateRequest(verifyCodeSchema), verifyCode)
authRoutes.post('/request-reset-password', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), sendRequestedResetPassword)
authRoutes.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword)
authRoutes.post('/mail-checker', validateRequest(sendOrResetOrMailCheckerVerificationCodeSchema), internalEmailChecker)
authRoutes.get('/check-user', guard(['TOURIST', 'BUSINESS', 'ADMIN']), checkUser)
authRoutes.post('/logout', guard(['TOURIST', 'BUSINESS', 'ADMIN']), logout)

export default authRoutes
