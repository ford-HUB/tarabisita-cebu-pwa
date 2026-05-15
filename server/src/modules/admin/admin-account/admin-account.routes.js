import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { getMyAdminProfile, patchMyAdminProfile } from './admin-account.controller.js'
import { updateAdminProfileSchema } from './admin-account.validator.js'

const adminAccountRoutes = express.Router()

adminAccountRoutes.get('/profile', guard(['ADMIN']), getMyAdminProfile)
adminAccountRoutes.patch('/profile', guard(['ADMIN']), validateRequest(updateAdminProfileSchema), patchMyAdminProfile)

export default adminAccountRoutes
