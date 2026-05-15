import { create } from 'zustand'
import { toast } from 'sonner'
import { groupCartItemsByBusiness } from '../tourist/tourist-cart-item.store.js'
import {
  isTouristCartStayListing,
  pickCartItemDetailsFromPayload
} from '../../shared/utils/tourist-cart-item-details.utils.js'

const itemKey = (businessId, catalogItemId) => `${businessId}:${catalogItemId}`

const resolveCatalogItemId = (payload) =>
  String(payload.catalogItemId ?? payload.menuItemId ?? '').trim()

export const useGuestCartStore = create((set, get) => ({
  items: [],
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
   * @param {Record<string, unknown>} payload
   * @param {{ silent?: boolean }} [options]
   */
  addItem: (payload, options = {}) => {
    const { silent } = options
    const { businessId, businessName, name, unitPrice, image } = payload
    const notifyItemAdded = () => {
      if (silent) return
      const label = String(name || '').trim()
      toast.success('Added to cart', label ? { description: label } : undefined)
    }
    const catalogItemId = resolveCatalogItemId(payload)
    if (!businessId || !catalogItemId || !name) return
    const key = itemKey(businessId, catalogItemId)
    const qty = Math.min(99, Math.max(1, Number(payload.qty) || 1))
    const details = pickCartItemDetailsFromPayload(payload)
    const prev = get().items
    const idx = prev.findIndex((it) => it.key === key)
    if (idx >= 0) {
      if (isTouristCartStayListing(payload)) {
        if (!silent) {
          toast.message('Already in your cart', {
            description: 'This stay package is already saved. Remove it from your cart first if you want to change it.'
          })
        }
        return
      }
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        qty: Math.min(99, next[idx].qty + qty),
        listingType: String(payload.listingType || next[idx].listingType || ''),
        ...details
      }
      set({ items: next })
      notifyItemAdded()
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
          listingType: String(payload.listingType || ''),
          ...details,
          itemNotes: ''
        }
      ]
    })
    notifyItemAdded()
  },

  /**
   * Replace an existing cart row (edit flow — does not merge quantities).
   * @param {string} key
   * @param {Record<string, unknown>} payload
   * @param {{ silent?: boolean }} [options]
   * @returns {boolean}
   */
  updateItem: (key, payload, options = {}) => {
    const { silent } = options
    const k = String(key || '').trim()
    if (!k) return false
    const prev = get().items
    const idx = prev.findIndex((it) => it.key === k)
    if (idx < 0) return false

    const row = prev[idx]
    const catalogItemId = resolveCatalogItemId(payload) || row.catalogItemId
    const qty = Math.min(99, Math.max(1, Number(payload.qty) || row.qty || 1))
    const details = pickCartItemDetailsFromPayload(payload)

    const next = [...prev]
    next[idx] = {
      ...row,
      businessId: String(payload.businessId || row.businessId),
      businessName: String(payload.businessName || row.businessName || 'Business'),
      catalogItemId,
      name: String(payload.name || row.name),
      unitPrice: Number(payload.unitPrice ?? row.unitPrice) || 0,
      image: String(payload.image ?? row.image ?? ''),
      qty,
      listingType: String(payload.listingType || row.listingType || ''),
      ...details,
      itemNotes: String(payload.itemNotes ?? row.itemNotes ?? '').slice(0, 500)
    }
    set({ items: next })
    if (!silent) {
      const label = String(next[idx].name || '').trim()
      toast.success('Cart updated', label ? { description: label } : undefined)
    }
    return true
  },

  setItemQty: (key, qty) => {
    const q = Math.min(99, Math.max(1, Number(qty) || 1))
    set({
      items: get().items.map((it) => (it.key === key ? { ...it, qty: q } : it))
    })
  },

  removeItem: (key) => {
    set((s) => {
      const { [key]: _, ...rest } = s.deselectedItemKeys
      return { items: s.items.filter((it) => it.key !== key), deselectedItemKeys: rest }
    })
  },

  clear: () => set({ items: [], deselectedItemKeys: {} }),

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
        listingType: String(it.listingType || ''),
        ...pickCartItemDetailsFromPayload(it),
        itemNotes: String(it.itemNotes ?? '').slice(0, 500)
      }
    })
    const deselectedItemKeys =
      payload.deselectedItemKeys &&
      typeof payload.deselectedItemKeys === 'object' &&
      !Array.isArray(payload.deselectedItemKeys)
        ? { ...payload.deselectedItemKeys }
        : {}
    set({ items, deselectedItemKeys })
  },

  groupByBusiness: () => groupCartItemsByBusiness(get().items)
}))
