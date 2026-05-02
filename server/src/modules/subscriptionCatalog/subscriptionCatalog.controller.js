import { getResolvedCatalog, upsertSubscriptionCatalog } from './subscriptionCatalog.service.js'

export const getSubscriptionCatalog = async (_req, res) => {
    try {
        const data = await getResolvedCatalog()
        return res.status(200).json({
            message: 'Subscription catalog loaded',
            data
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to load subscription catalog' })
    }
}

export const putAdminSubscriptionCatalog = async (req, res) => {
    try {
        const body = req.validatedData.body
        await upsertSubscriptionCatalog(body)
        const data = await getResolvedCatalog()
        return res.status(200).json({
            message: 'Subscription catalog saved',
            data
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to save subscription catalog' })
    }
}
