import { apiInstance } from '../../api/_base_.js'

export const getAdminProfile = async () => {
  const response = await apiInstance.get('admin/account/profile')
  return response
}

export const patchAdminProfile = async (body) => {
  const response = await apiInstance.patch('admin/account/profile', body)
  return response
}
