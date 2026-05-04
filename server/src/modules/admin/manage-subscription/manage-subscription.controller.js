import { getResolvedCatalog, upsertManageSubscriptionCatalog } from './manage-subscription.service.js'

export const getManageSubscriptionCatalog = async (_req, res) => {
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

export const putManageSubscriptionCatalog = async (req, res) => {
    try {
        const body = req.validatedData.body
        await upsertManageSubscriptionCatalog(body)
        const data = await getResolvedCatalog()
        return res.status(200).json({
            message: 'Subscription catalog saved',
            data
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to save subscription catalog' })
    }
}
