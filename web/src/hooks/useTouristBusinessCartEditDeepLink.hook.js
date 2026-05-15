import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { TOURIST_CART_EDIT_KEY_STORAGE } from '../components/layout/tourist/touristLayout.constants.js'
import { useTouristCartItemStore } from '../store/tourist/tourist-cart-item.store.js'

const isMenuItemOrderable = (item) =>
  Boolean(item?.isAvailable) && String(item?.stockStatus || '') !== 'OUT_OF_STOCK'

const readCartEditKeyFromStorage = () => {
  try {
    const v = sessionStorage.getItem(TOURIST_CART_EDIT_KEY_STORAGE)
    return v && String(v).trim() ? String(v).trim() : null
  } catch {
    return null
  }
}

const clearCartEditKeyFromStorage = () => {
  try {
    sessionStorage.removeItem(TOURIST_CART_EDIT_KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

/**
 * When a business detail URL includes `editMenuItem` (+ optional `editCartKey`),
 * opens the menu item modal with cart qty/details preloaded for editing.
 */
export const useTouristBusinessCartEditDeepLink = ({
  businessId,
  businessName,
  menuItems,
  isStayBusiness,
  setSelectedMenuItem,
  setEditCartKey,
  setHighlightMenuItemId,
  setIsPackageModalOpen,
  setSelectedPackageId
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const editMenuItem = searchParams.get('editMenuItem')
  const editCartKeyParam = searchParams.get('editCartKey')

  useEffect(() => {
    const menuItemId = editMenuItem?.trim()
    if (!menuItemId || !businessId) return undefined

    const clearEditParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('editMenuItem')
          next.delete('editCartKey')
          return next
        },
        { replace: true }
      )
    }

    const cartKeyFromUrl = editCartKeyParam?.trim() || readCartEditKeyFromStorage()
    const cartItem =
      (cartKeyFromUrl
        ? useTouristCartItemStore.getState().items.find((it) => it.key === cartKeyFromUrl)
        : null) ||
      useTouristCartItemStore.getState().items.find(
        (it) =>
          String(it.businessId) === String(businessId) &&
          String(it.catalogItemId) === menuItemId
      )

    const found = (menuItems || []).find((it) => String(it?.id) === menuItemId)
    if (!found) return undefined

    clearEditParams()
    clearCartEditKeyFromStorage()

    if (isStayBusiness) {
      if (!isMenuItemOrderable(found)) {
        toast.error('This package is not available right now.')
        return undefined
      }
      setSelectedPackageId(menuItemId)
      setIsPackageModalOpen(true)
      setHighlightMenuItemId?.(menuItemId)
      if (cartItem?.key) setEditCartKey(cartItem.key)
      return undefined
    }

    if (!isMenuItemOrderable(found)) {
      toast.error('This item is not available right now.')
      return undefined
    }

    setHighlightMenuItemId?.(menuItemId)
    if (cartItem?.key) setEditCartKey(cartItem.key)

    setSelectedMenuItem({
      ...found,
      businessId: String(businessId),
      businessName: String(businessName || '').trim() || 'Business',
      _initialCartQty: cartItem?.qty
    })

    return undefined
  }, [
    editMenuItem,
    editCartKeyParam,
    businessId,
    businessName,
    menuItems,
    isStayBusiness,
    setSearchParams,
    setSelectedMenuItem,
    setEditCartKey,
    setHighlightMenuItemId,
    setIsPackageModalOpen,
    setSelectedPackageId
  ])
}
