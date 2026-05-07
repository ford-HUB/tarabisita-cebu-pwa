import { apiInstance } from '../../api/_base_.js'

export const getMyBusinessDashboard = async ({ year, month } = {}) => {
  const params = {}
  if (year) params.year = year
  if (month) params.month = month
  const response = await apiInstance.get('business/me/reports/dashboard', { params })
  return response
}
