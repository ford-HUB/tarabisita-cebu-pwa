import { apiInstance } from '../../api/_base_.js'

const getTotal = (response) => Number(response?.data?.total) || 0

const getRows = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])

export const getAdminDashboardSnapshot = async () => {
  const [allUsersRes, touristUsersRes, businessUsersRes, adminUsersRes, partnersRes, approvalsRes, transactionsRes] =
    await Promise.all([
      apiInstance.get('admin/manage-users/users', { params: { page: 1, limit: 1 } }),
      apiInstance.get('admin/manage-users/users', { params: { role: 'TOURIST', page: 1, limit: 1 } }),
      apiInstance.get('admin/manage-users/users', { params: { role: 'BUSINESS', page: 1, limit: 1 } }),
      apiInstance.get('admin/manage-users/users', { params: { role: 'ADMIN', page: 1, limit: 1 } }),
      apiInstance.get('business/admin/partners'),
      apiInstance.get('business/admin/approval-queue'),
      apiInstance.get('admin/transaction/plan-subscription-transactions', {
        params: { days: 'all', status: 'ALL' }
      })
    ])

  return {
    users: {
      total: getTotal(allUsersRes),
      tourists: getTotal(touristUsersRes),
      businessOwners: getTotal(businessUsersRes),
      admins: getTotal(adminUsersRes)
    },
    partners: getRows(partnersRes),
    approvals: getRows(approvalsRes),
    transactions: getRows(transactionsRes)
  }
}
