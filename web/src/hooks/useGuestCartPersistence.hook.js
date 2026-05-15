import { useEffect, useRef } from 'react'
import { readGuestCartSnapshot, writeGuestCartSnapshot } from '../shared/utils/guestCartStorage.utils.js'
import { useGuestCartStore } from '../store/guest/guest-cart.store.js'

/**
 * Hydrates guest cart from localStorage on public layout mount and persists changes.
 */
export const useGuestCartPersistence = () => {
  const hydrateCart = useGuestCartStore((s) => s.hydrateCart)
  const skipPersistRef = useRef(true)

  useEffect(() => {
    skipPersistRef.current = true
    hydrateCart(readGuestCartSnapshot())
    skipPersistRef.current = false
  }, [hydrateCart])

  useEffect(() => {
    return useGuestCartStore.subscribe(() => {
      if (skipPersistRef.current) return
      const { items, deselectedItemKeys } = useGuestCartStore.getState()
      writeGuestCartSnapshot({ items, deselectedItemKeys })
    })
  }, [])
}
