import { apiInstance } from '../../api/_base_.js'

export const getAdminUsers = async (params) => {
  const response = await apiInstance.get('admin/manage-users/users', { params })
  return response
}

export const patchAdminUserWhitelist = async (userId, whitelisted) => {
  const response = await apiInstance.patch(`admin/manage-users/${userId}/whitelist`, { whitelisted })
  return response
}

export const deleteAdminUser = async (userId) => {
  const response = await apiInstance.delete(`admin/manage-users/${userId}`)
  return response
}

export const sendAdminUserWarningEmail = async (userId, formData) => {
  const response = await apiInstance.post(`admin/manage-users/${userId}/warning-email`, formData)
  return response
}
