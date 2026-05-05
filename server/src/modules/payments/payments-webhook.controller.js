import { processXenditWebhookEvent, registerXenditWebhook } from './payments.service.js'

export const handleXenditCheckoutWebhook = async (req, res) => {
    try {
        const result = await processXenditWebhookEvent(req.body, req.headers)
        return res.status(200).json({
            message: result.duplicate ? 'Duplicate webhook ignored' : 'Webhook processed',
            data: result
        })
    } catch (error) {
        if (error.message === 'XENDIT_WEBHOOK_TOKEN_INVALID') {
            return res.status(401).json({ message: 'Invalid Xendit webhook callback token' })
        }
        return res.status(200).json({
            message: 'Webhook accepted with processing error',
            error: error.message
        })
    }
}

export const registerXenditWebhookEndpoint = async (req, res) => {
    try {
        const result = await registerXenditWebhook(req.validatedData.body || {})
        return res.status(200).json({
            message: result.alreadyExists
                ? 'Xendit webhook callback already configured'
                : 'Xendit webhook setup instructions prepared',
            data: result
        })
    } catch (error) {
        if (error.message === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (error.message === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (error.message === 'XENDIT_WEBHOOK_CALLBACK_URL_NOT_CONFIGURED') {
            return res.status(400).json({
                message: 'Callback URL is required. Provide callbackUrl in request body or set SERVER_PUBLIC_URL.'
            })
        }
        return res.status(500).json({ message: error.message })
    }
}
