/** Optional fields copied onto cart items for display (cart + checkout review). */
export const CART_ITEM_DETAIL_FIELD_KEYS = [
  'description',
  'category',
  'flavor',
  'preparationTime',
  'servingSize',
  'spiceLevel',
  'allergens',
  'amenities'
]

/**
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, string>}
 */
export const pickCartItemDetailsFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return {}
  const o = {}
  for (const k of CART_ITEM_DETAIL_FIELD_KEYS) {
    const raw = payload[k]
    const s = raw == null ? '' : String(raw).trim()
    if (!s) continue
    if (k === 'spiceLevel' && s === 'No Spice') continue
    o[k] = s
  }
  return o
}

/**
 * @param {Record<string, unknown>} item — catalog row from explore / business modal
 * @returns {Record<string, string>}
 */
export const pickCartItemDetailsFromMenuItem = (item) =>
  pickCartItemDetailsFromPayload({
    description: item?.description,
    category: item?.category,
    flavor: item?.flavor,
    preparationTime: item?.preparationTime,
    servingSize: item?.servingSize,
    spiceLevel: item?.spiceLevel,
    allergens: item?.allergens,
    amenities: item?.amenities || item?.allergens
  })
