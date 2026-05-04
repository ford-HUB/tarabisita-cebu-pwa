import { create } from 'zustand'
import { toast } from 'sonner'
import { pickCartItemDetailsFromPayload } from '../../shared/utils/tourist-cart-item-details.utils.js'

const itemKey = (businessId, catalogItemId) => `${businessId}:${catalogItemId}`

const resolveCatalogItemId = (payload) =>
  String(payload.catalogItemId ?? payload.menuItemId ?? '').trim()

/**
 * @typedef {{
 *   key: string,
 *   businessId: string,
 *   businessName: string,
 *   catalogItemId: string,
 *   name: string,
 *   unitPrice: number,
 *   image: string,
 *   qty: number,
 *   description?: string,
 *   category?: string,
 *   flavor?: string,
 *   preparationTime?: string,
 *   servingSize?: string,
 *   spiceLevel?: string,
 *   allergens?: string,
 *   itemNotes?: string
 * }} TouristCartItem
 */

const MAX_ITEM_NOTES = 500

/** Cap length only; do not trim (trim on submit / display-only) so spaces survive while typing and sync. */
const clampItemNotes = (v) => String(v ?? '').slice(0, MAX_ITEM_NOTES)

export const groupCartItemsByBusiness = (list) => {
  const map = new Map()
  for (const it of list) {
    if (!map.has(it.businessId)) {
      map.set(it.businessId, { businessId: it.businessId, businessName: it.businessName, items: [] })
    }
    map.get(it.businessId).items.push(it)
  }
  return Array.from(map.values())
}

export const useTouristCartItemStore = create((set, get) => ({
  items: [],
  /** Item keys the user explicitly unchecked (default: every item is selected). */
  deselectedItemKeys: {},

  isItemSelected: (key) => !get().deselectedItemKeys[String(key)],

  toggleItemSelected: (key) => {
    const k = String(key)
    set((s) => {
      const d = { ...s.deselectedItemKeys }
      if (d[k]) delete d[k]
      else d[k] = true
      return { deselectedItemKeys: d }
    })
  },

  /**
   * @param {{ businessId: string, businessName?: string, catalogItemId?: string, menuItemId?: string, name: string, unitPrice: number, image?: string, qty?: number } & Record<string, unknown>} payload
   * @param {{ silent?: boolean }} [options]
   */
  addItem: (payload, options = {}) => {
    const { silent } = options
    const { businessId, businessName, name, unitPrice, image } = payload
    const catalogItemId = resolveCatalogItemId(payload)
    if (!businessId || !catalogItemId || !name) return
    const key = itemKey(businessId, catalogItemId)
    const qty = Math.min(99, Math.max(1, Number(payload.qty) || 1))
    const details = pickCartItemDetailsFromPayload(payload)
    const prev = get().items
    const idx = prev.findIndex((it) => it.key === key)
    if (idx >= 0) {
      const next = [...prev]
      const merged = Math.min(99, next[idx].qty + qty)
      const incomingNotes = clampItemNotes(payload.itemNotes)
      next[idx] = {
        ...next[idx],
        qty: merged,
        ...details,
        ...(incomingNotes.trim() ? { itemNotes: incomingNotes } : {})
      }
      set({ items: next })
      if (!silent) toast.success('Cart updated')
      return
    }
    set({
      items: [
        ...prev,
        {
          key,
          businessId: String(businessId),
          businessName: businessName || 'Business',
          catalogItemId,
          name,
          unitPrice: Number(unitPrice) || 0,
          image: image || '',
          qty,
          ...details,
          itemNotes: clampItemNotes(payload.itemNotes)
        }
      ]
    })
    if (!silent) toast.success('Added to cart')
  },

  /** @param {string} key */
  setItemQty: (key, qty) => {
    const q = Math.min(99, Math.max(1, Number(qty) || 1))
    set({
      items: get().items.map((it) => (it.key === key ? { ...it, qty: q } : it))
    })
  },

  /** @param {string} key */
  setItemNotes: (key, notes) => {
    const n = clampItemNotes(notes)
    set({
      items: get().items.map((it) => (it.key === key ? { ...it, itemNotes: n } : it))
    })
  },

  /** @param {string} key */
  removeItem: (key) => {
    set((s) => {
      const { [key]: _, ...rest } = s.deselectedItemKeys
      return { items: s.items.filter((it) => it.key !== key), deselectedItemKeys: rest }
    })
  },

  clear: () => set({ items: [], deselectedItemKeys: {} }),

  /** Remove specific cart items (e.g. after a successful partial checkout). */
  removeItemsByKeys: (keys) => {
    const keySet = new Set((keys || []).map(String))
    if (!keySet.size) return
    set((s) => ({
      items: s.items.filter((it) => !keySet.has(it.key)),
      deselectedItemKeys: Object.fromEntries(
        Object.entries(s.deselectedItemKeys).filter(([k]) => !keySet.has(k))
      )
    }))
  },

  /** Remove all items for one business after a successful order. */
  removeItemsForBusiness: (businessId) => {
    const id = String(businessId)
    set((s) => {
      const nextItems = s.items.filter((it) => it.businessId !== id)
      const keptKeys = new Set(nextItems.map((it) => it.key))
      const nextDeselected = Object.fromEntries(
        Object.entries(s.deselectedItemKeys).filter(([k]) => keptKeys.has(k))
      )
      return { items: nextItems, deselectedItemKeys: nextDeselected }
    })
  },

  /** @returns {{ businessId: string, businessName: string, items: TouristCartItem[] }[]} */
  groupByBusiness: () => groupCartItemsByBusiness(get().items),

  /**
   * Replace cart from server (hydration). Ensures each item has a stable `key`.
   * @param {{ items?: unknown[], deselectedItemKeys?: Record<string, boolean> }} payload
   */
  hydrateCart: (payload = {}) => {
    const raw = Array.isArray(payload.items) ? payload.items : []
    const items = raw.map((it) => {
      const businessId = String(it.businessId || '')
      const catalogItemId = String(it.catalogItemId ?? it.menuItemId ?? '')
      const key = it.key || itemKey(businessId, catalogItemId)
      return {
        key,
        businessId,
        businessName: String(it.businessName || 'Business'),
        catalogItemId,
        name: String(it.name || ''),
        unitPrice: Number(it.unitPrice) || 0,
        image: String(it.image || ''),
        qty: Math.min(99, Math.max(1, Number(it.qty) || 1)),
        ...pickCartItemDetailsFromPayload(it),
        itemNotes: clampItemNotes(it.itemNotes)
      }
    })
    const deselectedItemKeys =
      payload.deselectedItemKeys &&
      typeof payload.deselectedItemKeys === 'object' &&
      !Array.isArray(payload.deselectedItemKeys)
        ? { ...payload.deselectedItemKeys }
        : {}
    set({ items, deselectedItemKeys })
  }
}))
