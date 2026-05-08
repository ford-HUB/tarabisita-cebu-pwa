import { apiInstance } from '../../api/_base_.js'

export const getAdminSystemPerformanceSnapshot = async () => {
  const response = await apiInstance.get('admin/system-performance/snapshot')
  return response
}
