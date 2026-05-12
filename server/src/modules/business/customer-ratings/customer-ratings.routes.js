import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { getMyCustomerRatings } from './customer-ratings.controller.js'
import { listMyCustomerRatingsSchema } from './customer-ratings.validator.js'

const customerRatingsRoutes = express.Router()

customerRatingsRoutes.get(
    '/me/customer-ratings',
    guard(['BUSINESS']),
    validateRequest(listMyCustomerRatingsSchema),
    getMyCustomerRatings
)

export default customerRatingsRoutes
