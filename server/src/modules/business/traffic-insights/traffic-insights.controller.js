import { getMyTrafficInsightsByUserId } from './traffic-insights.service.js'

export const getMyTrafficInsights = async (req, res) => {
  try {
    const date = req.query?.date
    const data = await getMyTrafficInsightsByUserId(req.user._id, date)
    return res.status(200).json({ data })
  } catch (error) {
    if (error.message === 'BUSINESS_NOT_FOUND') {
      return res.status(404).json({ message: 'Business profile not found' })
    }
    if (error.message === 'MENU_ORDERS_NOT_AVAILABLE') {
      return res.status(403).json({
        message: 'Traffic insights are currently available for restaurant menu orders.'
      })
    }
    return res.status(500).json({ message: error.message || 'Failed to load traffic insights' })
  }
}
