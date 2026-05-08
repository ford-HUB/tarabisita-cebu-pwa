import { apiInstance } from '../../api/_base_.js'

const resolveBusinessProfileScopePath = (businessCategory) => {
  const normalized = String(businessCategory || '').trim().toUpperCase()
  if (normalized === 'RESTAURANT') return 'restaurant'
  if (normalized === 'RESORT' || normalized === 'HOTEL') return 'resort'
  return ''
}

export const getMyBusinessProfile = async ({ businessCategory } = {}) => {
  const scopePath = resolveBusinessProfileScopePath(businessCategory)
  const endpoint = scopePath ? `business/me/${scopePath}` : 'business/me'
  const response = await apiInstance.get(endpoint)
  return response
}

export const getMyBusinessSettings = async () => {
  const response = await apiInstance.get('business/me/settings', {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
  })
  return response
}

export const updateMyBusinessSettings = async (data) => {
  const response = await apiInstance.put('business/me/settings', data)
  return response
}

export const verifyMyBusinessPaymentMethod = async (data) => {
  const response = await apiInstance.post('business/me/settings/payment-methods/verify', data)
  return response
}

export const createMyBusinessPaymentMethodSetupCheckout = async (data) => {
  const response = await apiInstance.post('business/me/settings/payment-methods/setup-checkout', data)
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

export const updateMyResortListingStock = async (menuItemId, stockStatus) => {
  const response = await apiInstance.patch(`business/me/resort/listings/${menuItemId}/stock`, {
    stockStatus
  })
  return response
}

export const restoreMyBusinessMenuItem = async (menuItemId) => {
  const response = await apiInstance.patch(`business/me/menu-items/${menuItemId}/restore`)
  return response
}
