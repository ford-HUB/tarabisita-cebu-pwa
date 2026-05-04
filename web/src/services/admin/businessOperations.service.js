import { apiInstance } from '../../api/_base_.js'

/** Business verification queue (admin). */
export const getBusinessApprovalQueue = async (status = 'ALL') => {
  const params = status && status !== 'ALL' ? { status } : {}
  const response = await apiInstance.get('business/admin/approval-queue', { params })
  return response
}

export const getAdminBusinessPartners = async () => {
  const response = await apiInstance.get('business/admin/partners')
  return response
}

export const updateBusinessApprovalStatus = async ({ businessId, status, notes = '' }) => {
  const response = await apiInstance.patch(`business/admin/approval-queue/${businessId}`, { status, notes })
  return response
}

export const getAdminPlanSubscriptionTransactions = async ({ days = '7', status = 'ALL' } = {}) => {
  const response = await apiInstance.get('admin/transaction/plan-subscription-transactions', {
    params: { days, status }
  })
  return response
}

/** Admin: persist full subscription marketing catalog. */
export const putManageSubscriptionCatalog = async (payload) => {
  const response = await apiInstance.put('admin/manage-subscription/catalog', payload)
  return response
}
