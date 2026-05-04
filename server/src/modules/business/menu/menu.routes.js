import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getMyBusinessMenuItems,
    createMyBusinessMenuItem,
    deleteMyBusinessMenuItem,
    updateMyBusinessMenuItemStock,
    restoreMyBusinessMenuItem,
    updateMyBusinessMenuItem
} from './menu.controller.js'
import {
    createBusinessMenuItemSchema,
    deleteBusinessMenuItemSchema,
    restoreBusinessMenuItemSchema,
    updateBusinessMenuItemSchema,
    updateBusinessMenuItemStockSchema
} from './menu.validator.js'

const menuRoutes = express.Router()

menuRoutes.get('/me/menu-items', guard(['BUSINESS']), getMyBusinessMenuItems)
menuRoutes.post('/me/menu-items', guard(['BUSINESS']), validateRequest(createBusinessMenuItemSchema), createMyBusinessMenuItem)
menuRoutes.delete('/me/menu-items/:menuItemId', guard(['BUSINESS']), validateRequest(deleteBusinessMenuItemSchema), deleteMyBusinessMenuItem)
menuRoutes.patch('/me/menu-items/:menuItemId', guard(['BUSINESS']), validateRequest(updateBusinessMenuItemSchema), updateMyBusinessMenuItem)
menuRoutes.patch('/me/menu-items/:menuItemId/stock', guard(['BUSINESS']), validateRequest(updateBusinessMenuItemStockSchema), updateMyBusinessMenuItemStock)
menuRoutes.patch('/me/menu-items/:menuItemId/restore', guard(['BUSINESS']), validateRequest(restoreBusinessMenuItemSchema), restoreMyBusinessMenuItem)

export default menuRoutes
