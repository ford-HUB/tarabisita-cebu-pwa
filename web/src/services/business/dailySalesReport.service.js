import { apiInstance } from '../../api/_base_.js'

export const getMyDailySalesReport = async (date) => {
  const params = {}
  if (date) params.date = date
  const response = await apiInstance.get('business/me/reports/daily-sales', { params })
  return response
}
