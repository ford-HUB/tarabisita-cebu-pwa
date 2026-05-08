import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

export const getAvatarFallback = (name) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Signed paths for `ProtectedRoute` (requires `rk` query). */
export const touristExploreHref = `/${toEncryptedRoute('tourist/explore')}`
export const buildTouristExploreBusinessDetailHref = (businessId) => {
  const id = String(businessId || '').trim()
  if (!id) return touristExploreHref
  return `/${toEncryptedRoute(`tourist/explore/business/${id}`)}`
}

/** Deep-link to Explore and open `TouristMenuItemDetailModal` when params are handled on Home. */
export const buildTouristExploreReorderHref = (businessId, menuItemId) => {
  const b = String(businessId || '').trim()
  const m = String(menuItemId || '').trim()
  if (!b || !m) return touristExploreHref
  const joiner = touristExploreHref.includes('?') ? '&' : '?'
  return `${touristExploreHref}${joiner}openMenuBusiness=${encodeURIComponent(b)}&openMenuItem=${encodeURIComponent(m)}`
}
export const touristCartHref = `/${toEncryptedRoute('tourist/explore/cart')}`
export const touristCheckoutHref = `/${toEncryptedRoute('tourist/explore/checkout')}`
export const touristStayBookingHref = `/${toEncryptedRoute('tourist/explore/stay-booking')}`
export const touristBookingPaymentHref = `/${toEncryptedRoute('tourist/booking-payment')}`
export const touristOrdersHref = `/${toEncryptedRoute('tourist/orders')}`
export const touristHistoryHref = `/${toEncryptedRoute('tourist/history')}`
export const touristMessagesHref = `/${toEncryptedRoute('tourist/messages')}`

/** @param {string} messagingToken — server-sealed payload (query `m`). */
export const buildTouristStoreMessagingHref = (messagingToken) => {
  const route = toEncryptedRoute('tourist/messages')
  const encoded = encodeURIComponent(messagingToken)
  return `${route}&m=${encoded}`
}

/** @param {string} conversationId — reopen an existing thread (query `c`). */
export const buildTouristStoreMessagingThreadHref = (conversationId) => {
  const route = toEncryptedRoute('tourist/messages')
  return `${route}&c=${encodeURIComponent(conversationId)}`
}

/** Full-width shell + horizontal padding (topbar + main share this). */
export const touristShellContentClass =
  'w-full max-w-none px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12'

