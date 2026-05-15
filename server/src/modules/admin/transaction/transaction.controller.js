import {
    listAdminPlanSubscriptionTransactions,
    getAdminPlanSubscriptionPaymentDetailById
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
