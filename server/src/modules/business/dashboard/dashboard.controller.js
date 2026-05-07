import { getMyBusinessDashboardByUserId } from './dashboard.service.js'

export const getMyBusinessDashboard = async (req, res) => {
  try {
    const { year, month } = req.query || {}
    const data = await getMyBusinessDashboardByUserId(req.user._id, { year, month })
    return res.status(200).json({ data })
  } catch (error) {
    if (error.message === 'BUSINESS_NOT_FOUND') {
      return res.status(404).json({ message: 'Business profile not found' })
    }
    if (error.message === 'MENU_DASHBOARD_NOT_AVAILABLE') {
      return res.status(403).json({
        message: 'The dashboard summary is currently available for restaurant menu orders.'
      })
    }
    return res.status(500).json({ message: error.message || 'Failed to load dashboard summary' })
  }
}
