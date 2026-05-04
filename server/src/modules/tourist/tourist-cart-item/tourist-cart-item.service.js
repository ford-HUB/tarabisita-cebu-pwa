import TouristUserCart from './tourist-cart-item.model.js'

const itemKey = (businessId, catalogItemId) => `${businessId}:${catalogItemId}`

const normalizeDeselected = (raw, validKeys) => {
  const valid = new Set(validKeys)
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const out = {}
  for (const [k, v] of Object.entries(src)) {
    if (valid.has(String(k)) && v === true) {
      out[String(k)] = true
    }
  }
  return out
}

/** @param {Record<string, unknown>} row */
const rowToNormalizedItem = (row) => {
  const businessId = String(row.businessId || '').trim()
  const catalogItemId = String(row.catalogItemId ?? row.menuItemId ?? '').trim()
  return {
    businessId,
    businessName: String(row.businessName || '').trim(),
    catalogItemId,
    name: String(row.name || '').trim(),
    unitPrice: Number(row.unitPrice) || 0,
    image: String(row.image || ''),
    qty: row.qty,
    description: String(row.description || ''),
    category: String(row.category || ''),
    flavor: String(row.flavor || ''),
    preparationTime: String(row.preparationTime || ''),
    servingSize: String(row.servingSize || ''),
    spiceLevel: String(row.spiceLevel || ''),
    allergens: String(row.allergens || ''),
    itemNotes: String(row.itemNotes || '').slice(0, 500)
  }
}

const mapDocItemToClient = (l) => {
  const n = rowToNormalizedItem(l)
  return {
    key: itemKey(n.businessId, n.catalogItemId),
    businessId: n.businessId,
    businessName: n.businessName,
    catalogItemId: n.catalogItemId,
    name: n.name,
    unitPrice: n.unitPrice,
    image: n.image || '',
    qty: n.qty,
    ...(n.description ? { description: n.description } : {}),
    ...(n.category ? { category: n.category } : {}),
    ...(n.flavor ? { flavor: n.flavor } : {}),
    ...(n.preparationTime ? { preparationTime: n.preparationTime } : {}),
    ...(n.servingSize ? { servingSize: n.servingSize } : {}),
    ...(n.spiceLevel ? { spiceLevel: n.spiceLevel } : {}),
    ...(n.allergens ? { allergens: n.allergens } : {}),
    ...(n.itemNotes ? { itemNotes: n.itemNotes } : {})
  }
}

const rawItemsFromDoc = (doc) => {
  if (!doc) return []
  if (Array.isArray(doc.items) && doc.items.length) {
    return doc.items
  }
  if (Array.isArray(doc.lines) && doc.lines.length) {
    return doc.lines
  }
  return []
}

const deselectedKeysFromDoc = (doc) => {
  if (!doc) return {}
  if (doc.deselectedItemKeys && typeof doc.deselectedItemKeys === 'object' && !Array.isArray(doc.deselectedItemKeys)) {
    return doc.deselectedItemKeys
  }
  if (doc.deselectedLineKeys && typeof doc.deselectedLineKeys === 'object' && !Array.isArray(doc.deselectedLineKeys)) {
    return doc.deselectedLineKeys
  }
  return {}
}

/**
 * @param {import('mongoose').Types.ObjectId} userId
 */
export const getTouristCartItemDto = async (userId) => {
  const doc = await TouristUserCart.findOne({ userId }).lean()
  if (!doc) {
    return { items: [], deselectedItemKeys: {} }
  }
  const items = rawItemsFromDoc(doc).map((row) => mapDocItemToClient(row))
  const keys = items.map((x) => x.key)
  const deselectedItemKeys = normalizeDeselected(deselectedKeysFromDoc(doc), keys)
  return { items, deselectedItemKeys }
}

/**
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {{ items: unknown[], deselectedItemKeys?: Record<string, boolean> }} payload
 */
export const removeTouristCartItemsForBusiness = async (userId, businessId) => {
  const bid = String(businessId).trim()
  const { items, deselectedItemKeys } = await getTouristCartItemDto(userId)
  const nextItems = items.filter((it) => String(it.businessId).trim() !== bid)
  if (nextItems.length === items.length) return { items, deselectedItemKeys }
  const payloadItems = nextItems.map(({ key: _k, ...rest }) => rest)
  return upsertTouristCartItems(userId, { items: payloadItems, deselectedItemKeys })
}

export const upsertTouristCartItems = async (userId, { items, deselectedItemKeys = {} }) => {
  const normalizedItems = (items || []).map((l) => ({
    businessId: String(l.businessId).trim(),
    businessName: String(l.businessName).trim(),
    catalogItemId: String(l.catalogItemId).trim(),
    name: String(l.name).trim(),
    unitPrice: Math.round(Number(l.unitPrice) * 100) / 100,
    image: String(l.image || '').slice(0, 4000),
    qty: Math.min(99, Math.max(1, Number(l.qty) || 1)),
    description: String(l.description || '').slice(0, 2000),
    category: String(l.category || '').slice(0, 2000),
    flavor: String(l.flavor || '').slice(0, 2000),
    preparationTime: String(l.preparationTime || '').slice(0, 2000),
    servingSize: String(l.servingSize || '').slice(0, 2000),
    spiceLevel: String(l.spiceLevel || '').slice(0, 2000),
    allergens: String(l.allergens || '').slice(0, 2000),
    itemNotes: String(l.itemNotes || '').slice(0, 500)
  }))

  const keys = normalizedItems.map((it) => itemKey(it.businessId, it.catalogItemId))
  const cleanedDeselected = normalizeDeselected(deselectedItemKeys, keys)

  await TouristUserCart.findOneAndUpdate(
    { userId },
    {
      $set: {
        items: normalizedItems,
        deselectedItemKeys: cleanedDeselected
      },
      $unset: {
        lines: '',
        deselectedLineKeys: ''
      }
    },
    { upsert: true, returnDocument: 'after' }
  )

  return getTouristCartItemDto(userId)
}

