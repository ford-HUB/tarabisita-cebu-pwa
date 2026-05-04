import { getTouristMenuOrderCheckoutStatusForUser } from '../../payments/payments.service.js'

export const getMyMenuOrderCheckoutStatus = async (req, res) => {
    try {
        const data = await getTouristMenuOrderCheckoutStatusForUser(req.user._id, req.params.pendingId)
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            Pragma: 'no-cache'
        })
        return res.status(200).json({ data })
    } catch (error) {
        if (error.message === 'INVALID_PENDING_CHECKOUT_ID') {
            return res.status(400).json({ message: 'Invalid pending checkout id' })
        }
        if (error.message === 'PENDING_CHECKOUT_NOT_FOUND') {
            return res.status(404).json({ message: 'Checkout session not found' })
        }
        return res.status(500).json({ message: error.message || 'Could not load checkout status.' })
    }
}
