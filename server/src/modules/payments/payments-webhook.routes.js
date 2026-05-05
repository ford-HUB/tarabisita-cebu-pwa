import express from 'express'
import { guard } from '../../shared/middlewares/guard.js'
import { validateRequest } from '../../shared/middlewares/validateRequest.js'
import { handleXenditCheckoutWebhook, registerXenditWebhookEndpoint } from './payments-webhook.controller.js'
import { registerXenditWebhookSchema } from './payments-webhook.validator.js'

const paymentsWebhookRoutes = express.Router()

paymentsWebhookRoutes.post('/webhooks/xendit', handleXenditCheckoutWebhook)
paymentsWebhookRoutes.post('/webhooks/maya', handleXenditCheckoutWebhook)
paymentsWebhookRoutes.post(
    '/webhooks/xendit/register',
    guard(['BUSINESS', 'ADMIN']),
    validateRequest(registerXenditWebhookSchema),
    registerXenditWebhookEndpoint
)

export default paymentsWebhookRoutes
