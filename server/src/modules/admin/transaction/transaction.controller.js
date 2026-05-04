import { listAdminPlanSubscriptionTransactions } from './transaction.service.js'

export const getAdminPlanSubscriptionTransactions = async (req, res) => {
    try {
        const { days, status } = req.validatedData.query
        const rows = await listAdminPlanSubscriptionTransactions({ days, status })
        return res.status(200).json({ data: rows })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
