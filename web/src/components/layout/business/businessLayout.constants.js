import {
  FiBarChart2,
  FiBox,
  FiClipboard,
  FiCreditCard,
  FiDatabase,
  FiGrid,
  FiMessageSquare,
  FiShield,
  FiUser
} from 'react-icons/fi'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'
import { getBusinessCategoryLabel } from '../../../shared/constants/businessCategories.constants'

/** Customer order chats (query `c` = conversation id). */
export const buildBusinessStoreMessagingThreadHref = (conversationId) => {
  const route = toEncryptedRoute('business/dashboard/chat')
  return `${route}&c=${encodeURIComponent(conversationId)}`
}

export const businessOrdersHref = `/${toEncryptedRoute('business/dashboard/orders')}`

/** Deep link to Orders with optional `o` = customer order id (opens details when the board loads). */
export const buildBusinessOrderDeepLinkHref = (orderId) => {
  const route = toEncryptedRoute('business/dashboard/orders')
  return `${route}&o=${encodeURIComponent(String(orderId))}`
}

export const businessChatHubHref = `/${toEncryptedRoute('business/dashboard/chat')}`

export const businessNotificationsHref = `/${toEncryptedRoute('business/dashboard/notifications')}`

export const businessDashboardHref = `/${toEncryptedRoute('business/dashboard')}`

export const buildBusinessSidebarLinks = (businessCategory) => {
  const categoryLabel = getBusinessCategoryLabel(businessCategory)
  const baseBusinessPath = `/${toEncryptedRoute('business/dashboard')}`
  const normalizedCategory = String(businessCategory || '').trim().toUpperCase()
  const addItemLabel = normalizedCategory === 'RESTAURANT' ? 'Menus' : 'Products'
  const addItemPath = `/${toEncryptedRoute('business/dashboard/menu')}`
  const ordersPath = `/${toEncryptedRoute('business/dashboard/orders')}`
  const todaysRecordPath = `/${toEncryptedRoute('business/dashboard/todays-record')}`
  const yourBusinessChildren =
    normalizedCategory === 'RESTAURANT'
      ? [
          { label: 'Interface', path: `/${toEncryptedRoute('business/dashboard/interface')}` },
          { label: addItemLabel, path: addItemPath },
          { label: 'Orders', path: ordersPath },
          { label: "Today's record", path: todaysRecordPath }
        ]
      : [
          { label: 'Interface', path: `/${toEncryptedRoute('business/dashboard/interface')}` },
          { label: addItemLabel, path: addItemPath },
          'Product List'
        ]
  const profilePath = `/${toEncryptedRoute('business/dashboard/profile')}`

  return [
    { type: 'section', label: 'Business' },
    { label: 'Dashboard', icon: FiGrid, path: baseBusinessPath },
    { label: 'User Profile', icon: FiUser, path: profilePath },
    {
      label: `Your ${categoryLabel}`,
      icon: FiBox,
      children: yourBusinessChildren
    },
    ...(normalizedCategory === 'RESTAURANT'
      ? []
      : [
          {
            label: 'Bookings',
            icon: FiClipboard,
            path: ordersPath
          }
        ]),
    { type: 'section', label: 'Support' },
    {
      label: 'Chat',
      icon: FiMessageSquare,
      path: `/${toEncryptedRoute('business/dashboard/chat')}`
    },
    {
      label: 'Billing',
      icon: FiCreditCard,
      path: `/${toEncryptedRoute('business/dashboard/billing')}`
    },
    {
      label: 'Records',
      icon: FiDatabase,
      path: `/${toEncryptedRoute('business/dashboard/records')}`
    },
    { type: 'section', label: 'Other' },
    {
      label: 'Reports',
      icon: FiBarChart2,
      children: ['Daily Sales', 'Traffic Insights']
    },
    {
      label: 'Security & Activity Log',
      icon: FiShield,
      path: `${profilePath}&view=activity`
    }
  ]
}

export const getAvatarFallback = (name) => {
  if (!name) return 'B'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

