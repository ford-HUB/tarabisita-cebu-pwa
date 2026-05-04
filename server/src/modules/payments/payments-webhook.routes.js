import express from 'express'
import { guard } from '../../shared/middlewares/guard.js'
import { validateRequest } from '../../shared/middlewares/validateRequest.js'
import { handlePaymongoCheckoutWebhook, registerPaymongoWebhookEndpoint } from './payments-webhook.controller.js'
import { registerPaymongoWebhookSchema } from './payments-webhook.validator.js'

const paymentsWebhookRoutes = express.Router()

paymentsWebhookRoutes.post('/webhooks/paymongo', handlePaymongoCheckoutWebhook)
paymentsWebhookRoutes.post('/webhooks/maya', handlePaymongoCheckoutWebhook)
paymentsWebhookRoutes.post(
    '/webhooks/paymongo/register',
    guard(['BUSINESS', 'ADMIN']),
    validateRequest(registerPaymongoWebhookSchema),
    registerPaymongoWebhookEndpoint
)

export default paymentsWebhookRoutes
