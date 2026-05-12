import { getMyCustomerRatingsByUserId } from './customer-ratings.service.js'

export const getMyCustomerRatings = async (req, res) => {
    try {
        const { page, limit, sentiment } = req.validatedData.query
        const data = await getMyCustomerRatingsByUserId(req.user._id, { page, limit, sentiment })
        return res.status(200).json({ data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message || 'Failed to load customer ratings' })
    }
}
