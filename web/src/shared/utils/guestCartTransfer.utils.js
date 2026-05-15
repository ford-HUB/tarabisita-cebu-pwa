import { useTouristCartItemStore } from '../../store/tourist/tourist-cart-item.store.js'
import {
  clearGuestCartCheckoutPending,
  clearGuestCartStorage,
  isGuestCartCheckoutPending,
  readGuestCartSnapshot
} from './guestCartStorage.utils.js'
import { pickCartItemDetailsFromPayload } from './tourist-cart-item-details.utils.js'

const itemKey = (businessId, catalogItemId) => `${businessId}:${catalogItemId}`

const normalizeGuestRow = (it) => {
  const businessId = String(it?.businessId || '')
  const catalogItemId = String(it?.catalogItemId ?? it?.menuItemId ?? '')
  const key = it?.key || itemKey(businessId, catalogItemId)
  return {
    key,
    businessId,
    businessName: String(it?.businessName || 'Business'),
    catalogItemId,
    name: String(it?.name || ''),
    unitPrice: Number(it?.unitPrice) || 0,
    image: String(it?.image || ''),
    qty: Math.min(99, Math.max(1, Number(it?.qty) || 1)),
    listingType: String(it?.listingType || ''),
    ...pickCartItemDetailsFromPayload(it),
    itemNotes: String(it?.itemNotes ?? '').slice(0, 500)
  }
}

/**
 * Merge guest localStorage rows into server list (guest wins on same catalog line).
 * @param {unknown[]} serverItems
 * @param {unknown[]} guestItems
 */
export const mergeGuestItemsIntoServerList = (serverItems, guestItems) => {
  const byKey = new Map()
  for (const raw of Array.isArray(serverItems) ? serverItems : []) {
    const row = normalizeGuestRow(raw)
    if (!row.businessId || !row.catalogItemId) continue
    byKey.set(row.key, row)
  }
  for (const raw of Array.isArray(guestItems) ? guestItems : []) {
    const row = normalizeGuestRow(raw)
    if (!row.businessId || !row.catalogItemId) continue
    const prev = byKey.get(row.key)
    if (prev) {
      byKey.set(row.key, {
        ...prev,
        ...row,
        qty: Math.min(99, prev.qty + row.qty)
      })
    } else {
      byKey.set(row.key, row)
    }
  }
  return Array.from(byKey.values())
}

/**
 * @returns {{ hadGuestItems: boolean, checkoutPending: boolean, singleBusinessId: string | null }}
 */
export const peekGuestCartTransfer = () => {
  const guest = readGuestCartSnapshot()
  const checkoutPending = isGuestCartCheckoutPending()
  const ids = [...new Set(guest.items.map((it) => String(it?.businessId || '').trim()).filter(Boolean))]
  return {
    hadGuestItems: guest.items.length > 0,
    checkoutPending,
    singleBusinessId: ids.length === 1 ? ids[0] : null
  }
}
