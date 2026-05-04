import express from 'express'
import multer from 'multer'
import {
    listAdminUsers,
    patchAdminUserWhitelist,
    deleteAdminUser,
    postAdminUserWarningEmail
} from './manage-users.controller.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    adminUsersListQuerySchema,
    adminUserIdParamsSchema,
    adminUserWhitelistBodySchema,
    adminUserWarningEmailSchema
} from './manage-users.validator.js'
import { guard } from '../../../shared/middlewares/guard.js'

const manageUsersRoutes = express.Router()

const adminUserEmailUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 12 * 1024 * 1024, files: 10 }
})

manageUsersRoutes.get('/users', guard(['ADMIN']), validateRequest(adminUsersListQuerySchema), listAdminUsers)
manageUsersRoutes.patch(
    '/:userId/whitelist',
    guard(['ADMIN']),
    validateRequest(adminUserWhitelistBodySchema),
    patchAdminUserWhitelist
)
manageUsersRoutes.delete('/:userId', guard(['ADMIN']), validateRequest(adminUserIdParamsSchema), deleteAdminUser)
manageUsersRoutes.post(
    '/:userId/warning-email',
    guard(['ADMIN']),
    adminUserEmailUpload.array('files', 10),
    validateRequest(adminUserWarningEmailSchema),
    postAdminUserWarningEmail
)

export default manageUsersRoutes
