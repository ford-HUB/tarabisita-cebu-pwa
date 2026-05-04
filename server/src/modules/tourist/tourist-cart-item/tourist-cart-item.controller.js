/**
 * HTTP handlers for `GET/PUT /api/v1/tourist/cart-items`.
 * (Kebab-case module: `tourist-cart-item.controller.js`.)
 */
import { getTouristCartItemDto, upsertTouristCartItems } from './tourist-cart-item.service.js'

export const getMyTouristCartItems = async (req, res) => {
  try {
    const data = await getTouristCartItemDto(req.user._id)
    return res.status(200).json({ data })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const putMyTouristCartItems = async (req, res) => {
  try {
    const { items, deselectedItemKeys } = req.validatedData.body
    const data = await upsertTouristCartItems(req.user._id, { items, deselectedItemKeys })
    return res.status(200).json({ data })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
