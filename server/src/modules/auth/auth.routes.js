import express from 'express'
import multer from 'multer'
import { register, login, logout, sendVerificationCode, resendVerificationCode, verifyCode, sendRequestedResetPassword, resetPassword, internalEmailChecker, checkUser } from './auth.controller.js'
import { listAdminUsers, patchAdminUserWhitelist, deleteAdminUser, postAdminUserWarningEmail } from './adminUsers.controller.js'
import { validateRequest } from '../shared/middlewares/validateRequest.js'
import { loginSchema, registerSchema, sendOrResetOrMailCheckerVerificationCodeSchema, resendVerificationCodeSchema, verifyCodeSchema, resetPasswordSchema } from '../shared/validators/user.validator.js'
import {
  adminUsersListQuerySchema,
  adminUserIdParamsSchema,
  adminUserWhitelistBodySchema,
  adminUserWarningEmailSchema
} from '../shared/validators/adminUsers.validator.js'

import { guard } from '../shared/middlewares/guard.js'

const authRoutes = express.Router()

const adminUserEmailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 10 }
})

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

authRoutes.get('/admin/users', guard(['ADMIN']), validateRequest(adminUsersListQuerySchema), listAdminUsers)
authRoutes.patch(
  '/admin/users/:userId/whitelist',
  guard(['ADMIN']),
  validateRequest(adminUserWhitelistBodySchema),
  patchAdminUserWhitelist
)
authRoutes.delete('/admin/users/:userId', guard(['ADMIN']), validateRequest(adminUserIdParamsSchema), deleteAdminUser)
authRoutes.post(
  '/admin/users/:userId/warning-email',
  guard(['ADMIN']),
  adminUserEmailUpload.array('files', 10),
  validateRequest(adminUserWarningEmailSchema),
  postAdminUserWarningEmail
)

export default authRoutes