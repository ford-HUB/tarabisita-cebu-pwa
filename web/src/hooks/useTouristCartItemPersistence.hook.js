import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './useAuth.hook.js'
import { getTouristCartItems, putTouristCartItems } from '../services/tourist/tourist-cart-item.service.js'
import { useTouristCartItemStore } from '../store/tourist/tourist-cart-item.store.js'

const SYNC_DEBOUNCE_MS = 450

const stripItemKeyForApi = (item) => {
  const { key: _k, ...rest } = item
  return rest
}

/**
 * Loads the tourist cart from the API after auth, and keeps it in sync (debounced PUT).
 * Only runs for authenticated tourists (tourist dashboard layout).
 * @see `tourist-cart-item.service.js` (kebab-case API module)
 */
export const useTouristCartItemPersistence = () => {
  const { user, isAuthenticated, isAuthLoading } = useAuth()
  const isTourist = user?.role === 'TOURIST'

  const hydrateCart = useTouristCartItemStore((s) => s.hydrateCart)
  const skipPersistRef = useRef(true)
  const debounceTimerRef = useRef(null)
  const baseUrlRef = useRef(
    typeof import.meta.env.VITE_SERVER_LOCAL === 'string'
      ? import.meta.env.VITE_SERVER_LOCAL.replace(/\/+$/, '')
      : ''
  )

  const persistNow = useCallback(async () => {
    if (!isAuthenticated || !isTourist) return
    const { items, deselectedItemKeys } = useTouristCartItemStore.getState()
    const body = {
      items: items.map(stripItemKeyForApi),
      deselectedItemKeys
    }
    try {
      await putTouristCartItems(body)
    } catch (err) {
      console.error('Failed to sync tourist cart', err)
    }
  }, [isAuthenticated, isTourist])

  const flushWithKeepalive = useCallback(() => {
    if (!isAuthenticated || !isTourist) return
    const base = baseUrlRef.current
    if (!base) return
    const { items, deselectedItemKeys } = useTouristCartItemStore.getState()
    const body = JSON.stringify({
      items: items.map(stripItemKeyForApi),
      deselectedItemKeys
    })
    try {
      fetch(`${base}/tourist/cart-items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        credentials: 'include',
        keepalive: true
      }).catch(() => {})
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, isTourist])

  const schedulePersist = useCallback(() => {
    if (skipPersistRef.current || !isAuthenticated || !isTourist) return
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      persistNow()
    }, SYNC_DEBOUNCE_MS)
  }, [isAuthenticated, isTourist, persistNow])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !isTourist) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      skipPersistRef.current = true
      try {
        const res = await getTouristCartItems()
        if (cancelled) return
        const payload = res?.data?.data
        const remoteItems = Array.isArray(payload?.items) ? payload.items : []
        const remoteDeselected =
          payload?.deselectedItemKeys &&
          typeof payload.deselectedItemKeys === 'object' &&
          !Array.isArray(payload.deselectedItemKeys)
            ? payload.deselectedItemKeys
            : {}

        // Server cart is canonical for authenticated users. Avoid reviving stale
        // local entries (e.g. items already removed after successful checkout).
        hydrateCart({ items: remoteItems, deselectedItemKeys: remoteDeselected })
      } catch (err) {
        console.error('Failed to load tourist cart', err)
      } finally {
        if (!cancelled) {
          skipPersistRef.current = false
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthLoading, isAuthenticated, isTourist, user?._id, hydrateCart])

  useEffect(() => {
    if (!isAuthenticated || !isTourist) {
      return undefined
    }
    return useTouristCartItemStore.subscribe(() => {
      schedulePersist()
    })
  }, [isAuthenticated, isTourist, schedulePersist])

  useEffect(() => {
    if (!isAuthenticated || !isTourist) {
      return undefined
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
        flushWithKeepalive()
      }
    }
    const onUnload = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      flushWithKeepalive()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onUnload)
    }
  }, [isAuthenticated, isTourist, flushWithKeepalive])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [])
}
