import {
    listAdminPlanSubscriptionTransactions,
    getAdminPlanSubscriptionPaymentDetailById,
    approvePlanSubscriptionPaymentByAdmin,
    rejectPlanSubscriptionPaymentByAdmin
} from './transaction.service.js'

export const getAdminPlanSubscriptionTransactions = async (req, res) => {
    try {
        const { days, status } = req.validatedData.query
        const rows = await listAdminPlanSubscriptionTransactions({ days, status })
        return res.status(200).json({ data: rows })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getAdminPlanSubscriptionPaymentDetail = async (req, res) => {
    try {
        const { paymentId } = req.validatedData.params
        const data = await getAdminPlanSubscriptionPaymentDetailById(paymentId)
        if (!data) {
            return res.status(404).json({ message: 'Payment not found.' })
        }
        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const mapReviewError = (message) => {
    const table = {
        INVALID_PAYMENT_ID: [400, 'Invalid payment id.'],
        NOT_FOUND: [404, 'Payment not found.'],
        NOT_PENDING: [400, 'This payment is no longer pending and cannot be changed here.'],
        BUSINESS_NOT_FOUND: [404, 'Business not found for this payment.'],
        NO_PENDING_SUBSCRIPTION: [400, 'No pending subscription checkout is linked to this payment.'],
        CONFLICT_NEWER_SUBSCRIPTION: [409, 'A newer active subscription exists; resolve manually before approving.']
    }
    return table[message] || null
}

export const postAdminPlanSubscriptionPaymentApprove = async (req, res) => {
    try {
        const { paymentId } = req.validatedData.params
        const adminId = req.user._id
        const data = await approvePlanSubscriptionPaymentByAdmin(paymentId, adminId)
        return res.status(200).json({ message: 'Payment approved and subscription activated.', data })
    } catch (error) {
        const mapped = mapReviewError(error?.message)
        if (mapped) {
            return res.status(mapped[0]).json({ message: mapped[1] })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postAdminPlanSubscriptionPaymentReject = async (req, res) => {
    try {
        const { paymentId } = req.validatedData.params
        const { reason } = req.validatedData.body
        const adminId = req.user._id
        const data = await rejectPlanSubscriptionPaymentByAdmin(paymentId, adminId, reason)
        return res.status(200).json({ message: 'Payment declined.', data })
    } catch (error) {
        const mapped = mapReviewError(error?.message)
        if (mapped) {
            return res.status(mapped[0]).json({ message: mapped[1] })
        }
        return res.status(500).json({ message: error.message })
    }
}
