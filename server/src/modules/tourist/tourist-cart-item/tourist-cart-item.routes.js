import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { putTouristCartItemSchema } from './tourist-cart-item.validator.js'
import { getMyTouristCartItems, putMyTouristCartItems } from './tourist-cart-item.controller.js'

const router = express.Router()

router.get('/cart-items', guard(['TOURIST']), getMyTouristCartItems)
router.put('/cart-items', guard(['TOURIST']), validateRequest(putTouristCartItemSchema), putMyTouristCartItems)

export default router
