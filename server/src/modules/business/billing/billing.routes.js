import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import { createMyBusinessBillingCheckout, getMyBusinessBillingLedger } from './billing.controller.js'
import { createBusinessBillingCheckoutSchema } from './billing.validator.js'

const billingRoutes = express.Router()

billingRoutes.get('/me/billing/ledger', guard(['BUSINESS']), getMyBusinessBillingLedger)
billingRoutes.post('/me/billing/checkout', guard(['BUSINESS']), validateRequest(createBusinessBillingCheckoutSchema), createMyBusinessBillingCheckout)

export default billingRoutes
