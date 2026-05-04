/**
 * Tourist cart HTTP client (`GET/PUT …/tourist/cart-items`).
 * Kebab-case file matches `server/src/modules/tourist/tourist-cart-item/`.
 */
import { apiInstance } from '../../api/_base_.js'

export const getTouristCartItems = async () => {
  const response = await apiInstance.get('tourist/cart-items')
  return response
}

/**
 * @param {{ items: unknown[], deselectedItemKeys?: Record<string, boolean> }} body
 */
export const putTouristCartItems = async (body) => {
  const response = await apiInstance.put('tourist/cart-items', body)
  return response
}
