import { generateMyDailySalesReportByUserId } from './daily-sales-report.service.js'

export const getMyDailySalesReport = async (req, res) => {
  try {
    const reportDate = req.query?.date
    const data = await generateMyDailySalesReportByUserId(req.user._id, reportDate)
    return res.status(200).json({ data })
  } catch (error) {
    if (error.message === 'BUSINESS_NOT_FOUND') {
      return res.status(404).json({ message: 'Business profile not found' })
    }
    if (error.message === 'MENU_ORDERS_NOT_AVAILABLE') {
      return res.status(403).json({
        message: 'Daily sales reports are currently available for restaurant orders and resort bookings.'
      })
    }
    return res.status(500).json({ message: error.message || 'Failed to generate daily sales report' })
  }
}
