import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchPublicBusinessById } from '../services/tourist/touristExplore.service.js'

const isMenuItemOrderable = (item) =>
  Boolean(item?.isAvailable) && String(item?.stockStatus || '') !== 'OUT_OF_STOCK'

/**
 * When Explore URL includes `openMenuBusiness` + `openMenuItem`, loads the public menu slice,
 * opens the item modal if the dish is currently orderable, otherwise toasts and strips the params.
 * @param {(item: Record<string, unknown> | null) => void} setSelectedMenuItem
 */
export const useTouristExploreMenuDeepLink = (setSelectedMenuItem) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const openMenuBusiness = searchParams.get('openMenuBusiness')
  const openMenuItem = searchParams.get('openMenuItem')

  useEffect(() => {
    if (!openMenuBusiness?.trim() || !openMenuItem?.trim()) return undefined

    let ignore = false

    const clearOpenMenuParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('openMenuBusiness')
          next.delete('openMenuItem')
          return next
        },
        { replace: true }
      )
    }

    ;(async () => {
      try {
        const res = await fetchPublicBusinessById(String(openMenuBusiness).trim())
        if (ignore) return
        const d = res?.data?.data
        const menuItems = Array.isArray(d?.menuItems) ? d.menuItems : []
        const found = menuItems.find((it) => String(it?.id) === String(openMenuItem).trim())
        if (ignore) return

        clearOpenMenuParams()

        if (!found) {
          toast.error('This item is not available right now.')
          return
        }
        if (!isMenuItemOrderable(found)) {
          toast.error('This item is not available right now.')
          return
        }

        setSelectedMenuItem({
          ...found,
          businessId: String(openMenuBusiness).trim(),
          businessName: String(d?.name || '').trim() || 'Business'
        })
      } catch {
        if (!ignore) {
          clearOpenMenuParams()
          toast.error('Could not open that menu item. Try again from Explore.')
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [openMenuBusiness, openMenuItem, setSearchParams, setSelectedMenuItem])
}
