import { apiInstance } from '../../api/_base_.js'

export const fetchPublicBusinesses = async () => {
  const response = await apiInstance.get('business/public')
  return response
}

export const fetchPublicBusinessById = async (businessId) => {
  const response = await apiInstance.get(`business/public/${businessId}`)
  return response
}

export const recordPublicBusinessView = async (businessId) => {
  const response = await apiInstance.post(`business/public/${businessId}/view`)
  return response
}

/** @param {string} [menuCategory] Use `ALL` for every food type, or a menu item category label. */
export const fetchPublicMenuFeed = async (menuCategory = 'ALL') => {
  const response = await apiInstance.get('business/public/menu-feed', {
    params: { menuCategory }
  })
  return response
}
