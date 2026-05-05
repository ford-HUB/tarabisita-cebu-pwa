import { apiInstance } from '../../api/_base_.js'

export const getMyBusinessProfile = async () => {
  const response = await apiInstance.get('business/me')
  return response
}

export const getMyBusinessActivityLogs = async ({ limit = 30 } = {}) => {
  const response = await apiInstance.get('business/me/activity-logs', {
    params: { limit }
  })
  return response
}

export const updateMyBusinessProfile = async (data) => {
  const response = await apiInstance.put('business/me', data)
  return response
}

export const uploadMyBusinessProfileImage = async (profileImage) => {
  const response = await apiInstance.post('business/me/profile-image', { profileImage })
  return response
}

export const uploadMyBusinessAvatarImage = async (avatarImage) => {
  const response = await apiInstance.post('business/me/avatar', { avatarImage })
  return response
}

export const uploadMyBusinessBannerImage = async (bannerImage) => {
  const response = await apiInstance.post('business/me/banner-image', { bannerImage })
  return response
}

export const changeMyBusinessPassword = async (data) => {
  const response = await apiInstance.post('business/me/change-password', data)
  return response
}

export const submitMyBusinessProof = async (data) => {
  const response = await apiInstance.post('business/submit-proof', data)
  return response
}

export const getMyBusinessMenuItems = async ({ includeDeleted = false } = {}) => {
  const response = await apiInstance.get('business/me/menu-items', {
    params: includeDeleted ? { includeDeleted: true } : {}
  })
  return response
}

export const createMyBusinessMenuItem = async (data) => {
  const response = await apiInstance.post('business/me/menu-items', data)
  return response
}

export const deleteMyBusinessMenuItem = async (menuItemId) => {
  const response = await apiInstance.delete(`business/me/menu-items/${menuItemId}`)
  return response
}

export const updateMyBusinessMenuItem = async (menuItemId, data) => {
  const response = await apiInstance.patch(`business/me/menu-items/${menuItemId}`, data)
  return response
}

export const updateMyBusinessMenuItemStock = async (menuItemId, stockStatus) => {
  const response = await apiInstance.patch(`business/me/menu-items/${menuItemId}/stock`, { stockStatus })
  return response
}

export const restoreMyBusinessMenuItem = async (menuItemId) => {
  const response = await apiInstance.patch(`business/me/menu-items/${menuItemId}/restore`)
  return response
}
