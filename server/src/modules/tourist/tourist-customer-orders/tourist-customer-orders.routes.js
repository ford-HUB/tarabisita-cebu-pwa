import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getMyTouristCustomerOrdersHandler } from './tourist-customer-orders.controller.js'

const touristCustomerOrdersRoutes = express.Router()

touristCustomerOrdersRoutes.get('/my-customer-orders', guard(['TOURIST']), getMyTouristCustomerOrdersHandler)

export default touristCustomerOrdersRoutes
