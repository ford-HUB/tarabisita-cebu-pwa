import { pickCartItemDetailsFromMenuItem } from './tourist-cart-item-details.utils.js'

/** Build guest/tourist cart payload from a catalog search or menu row. */
export const buildCartPayloadFromMenuItem = (item, qty = 1) => {
  if (!item) return null
  const listingType = String(item?.listingType || '').trim().toUpperCase()
  const images = Array.isArray(item.images) ? item.images : []
  const image = images.length ? String(images[0]).trim() : ''
  return {
    businessId: String(item.businessId),
    businessName: item.businessName,
    catalogItemId: String(item.id),
    name: item.name,
    unitPrice: Number(item.price) || 0,
    image,
    qty: Math.min(99, Math.max(1, Number(qty) || 1)),
    ...(listingType ? { listingType } : {}),
    ...pickCartItemDetailsFromMenuItem(item)
  }
}
