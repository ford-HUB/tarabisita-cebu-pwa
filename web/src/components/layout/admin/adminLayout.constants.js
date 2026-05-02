import { FiBriefcase, FiCreditCard, FiDollarSign, FiGrid, FiUsers } from 'react-icons/fi'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

export const adminSidebarLinks = [
  { type: 'section', label: 'Overview' },
  { label: 'Dashboard', icon: FiGrid, path: `/${toEncryptedRoute('admin/dashboard')}` },
  { type: 'section', label: 'Management' },
  {
    label: 'Business',
    icon: FiBriefcase,
    children: [
      { label: 'Business Partners', path: `/${toEncryptedRoute('admin/business')}` },
      { label: 'Request Approval', path: `/${toEncryptedRoute('admin/business/request-approval')}` }
    ]
  },
  {
    label: 'Manage users',
    icon: FiUsers,
    path: `/${toEncryptedRoute('admin/users')}`
  },
  { type: 'section', label: 'Billing' },
  {
    label: 'Transactions',
    icon: FiDollarSign,
    path: `/${toEncryptedRoute('admin/transactions')}`
  },
  {
    label: 'Plans & pricing',
    icon: FiCreditCard,
    path: `/${toEncryptedRoute('admin/subscription')}`
  }
]

export const getAdminAvatarFallback = (name) => {
  if (!name) return 'A'

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
