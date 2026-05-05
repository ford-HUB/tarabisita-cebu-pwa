import {
    createBusinessBillingCheckoutSessionByUserId,
    getBusinessBillingLedgerByUserId
} from './billing.service.js'
import { appendActivityLog } from '../../../shared/utils/business-controller.helpers.js'

export const createMyBusinessBillingCheckout = async (req, res) => {
    try {
        const { months, returnBaseUrl } = req.validatedData.body
        const checkout = await createBusinessBillingCheckoutSessionByUserId(req.user._id, months, { returnBaseUrl })
        await appendActivityLog(req, {
            action: 'BILLING_CHECKOUT_CREATED',
            category: 'BILLING',
            severity: 'MEDIUM',
            description: 'Billing checkout session was created.',
            details: {
                months
            }
        })
        return res.status(200).json({
            message: 'Xendit checkout created successfully',
            data: checkout
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'INVALID_BILLING_MONTHS') {
            return res.status(400).json({ message: 'Invalid billing duration' })
        }
        if (error.message === 'BILLING_PLAN_LOCKED_UNTIL_EXPIRY') {
            return res.status(400).json({
                message:
                    'Your current prepaid plan is still active. You can choose a new billing cycle after the current period ends.'
            })
        }
        if (error.message === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (error.message === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (error.message === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (error.message === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({
                message:
                    'Invalid return base URL. Send returnBaseUrl (e.g. https://your-site.com) or set CLIENT_URL / XENDIT_RETURN_BASE_URL to a full http(s) URL.'
            })
        }
        if (error.message === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build success or cancel return URLs.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getMyBusinessBillingLedger = async (req, res) => {
    try {
        const data = await getBusinessBillingLedgerByUserId(req.user._id)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
        res.set('Pragma', 'no-cache')
        return res.status(200).json({ data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}
