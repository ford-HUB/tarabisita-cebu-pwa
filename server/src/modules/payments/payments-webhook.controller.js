import { processPaymongoWebhookEvent, registerPaymongoWebhook } from './payments.service.js'

export const handlePaymongoCheckoutWebhook = async (req, res) => {
    try {
        const result = await processPaymongoWebhookEvent(req.body, req.headers)
        return res.status(200).json({
            message: result.duplicate ? 'Duplicate webhook ignored' : 'Webhook processed',
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            message: 'Webhook accepted with processing error',
            error: error.message
        })
    }
}

export const registerPaymongoWebhookEndpoint = async (req, res) => {
    try {
        const result = await registerPaymongoWebhook(req.validatedData.body || {})
        return res.status(200).json({
            message: result.alreadyExists
                ? 'PayMongo webhook already exists for this callback URL'
                : 'PayMongo webhook registered successfully',
            data: result
        })
    } catch (error) {
        if (error.message === 'PAYMONGO_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'PayMongo secret key is not configured' })
        }
        if (error.message === 'PAYMONGO_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'PayMongo secret key must start with sk_' })
        }
        if (error.message === 'PAYMONGO_WEBHOOK_CALLBACK_URL_NOT_CONFIGURED') {
            return res.status(400).json({
                message: 'Callback URL is required. Provide callbackUrl in request body or set SERVER_PUBLIC_URL.'
            })
        }
        return res.status(500).json({ message: error.message })
    }
}
