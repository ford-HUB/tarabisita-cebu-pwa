/** Page size for admin user list (must match server default max slice). */
export const ADMIN_USERS_PAGE_SIZE = 15

export const ROLE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All roles' },
  { value: 'TOURIST', label: 'Tourist' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ADMIN', label: 'Admin' }
]

export const WHITELIST_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Whitelist: all' },
  { value: 'true', label: 'Whitelisted only' },
  { value: 'false', label: 'Not whitelisted' }
]
