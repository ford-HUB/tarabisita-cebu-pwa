import {
  GUEST_CART_CHECKOUT_PENDING_KEY,
  GUEST_CART_STORAGE_KEY
} from '../constants/guestCart.constants.js'

/** @returns {{ items: unknown[], deselectedItemKeys: Record<string, boolean> }} */
export const readGuestCartSnapshot = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY)
    if (!raw) return { items: [], deselectedItemKeys: {} }
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed?.items) ? parsed.items : []
    const deselectedItemKeys =
      parsed?.deselectedItemKeys &&
      typeof parsed.deselectedItemKeys === 'object' &&
      !Array.isArray(parsed.deselectedItemKeys)
        ? parsed.deselectedItemKeys
        : {}
    return { items, deselectedItemKeys }
  } catch {
    return { items: [], deselectedItemKeys: {} }
  }
}

/** @param {{ items: unknown[], deselectedItemKeys?: Record<string, boolean> }} snapshot */
export const writeGuestCartSnapshot = (snapshot) => {
  try {
    localStorage.setItem(
      GUEST_CART_STORAGE_KEY,
      JSON.stringify({
        items: Array.isArray(snapshot?.items) ? snapshot.items : [],
        deselectedItemKeys:
          snapshot?.deselectedItemKeys &&
          typeof snapshot.deselectedItemKeys === 'object' &&
          !Array.isArray(snapshot.deselectedItemKeys)
            ? snapshot.deselectedItemKeys
            : {}
      })
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export const clearGuestCartStorage = () => {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    localStorage.removeItem(GUEST_CART_CHECKOUT_PENDING_KEY)
  } catch {
    /* ignore */
  }
}

export const setGuestCartCheckoutPending = () => {
  try {
    localStorage.setItem(GUEST_CART_CHECKOUT_PENDING_KEY, '1')
  } catch {
    /* ignore */
  }
}

export const isGuestCartCheckoutPending = () => {
  try {
    return localStorage.getItem(GUEST_CART_CHECKOUT_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export const clearGuestCartCheckoutPending = () => {
  try {
    localStorage.removeItem(GUEST_CART_CHECKOUT_PENDING_KEY)
  } catch {
    /* ignore */
  }
}
