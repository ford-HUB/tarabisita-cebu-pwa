import { encryptRouteWithPass } from './cryptoRoute.utils'

const getCryptoPassphrase = () => import.meta.env.VITE_ROLE_URL_CRYPTO_PASS || 'tarabisita-role-key'

const normalizeRoute = (routePath) => {
  if (typeof routePath !== 'string') return ''
  return routePath.trim().replace(/^\/+/, '').split('?')[0]
}

export const toEncryptedRoute = (routePath) => {
  const normalizedRoute = normalizeRoute(routePath)
  const encryptedRoute = encryptRouteWithPass(normalizedRoute, getCryptoPassphrase())
  return `${normalizedRoute}?rk=${encryptedRoute}`
}

export const isSignedRouteValid = (routePath, routeKey) => {
  const normalizedRoute = normalizeRoute(routePath)
  if (!normalizedRoute || !routeKey) return false

  const expectedRouteKey = encryptRouteWithPass(normalizedRoute, getCryptoPassphrase())
  return expectedRouteKey === routeKey
}

export const roleBasedRoute = (role) => {
  const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : ''

  const routeByRole = {
    TOURIST: 'tourist/home',
    BUSINESS: 'business/dashboard',
    ADMIN: 'admin/dashboard'
  }

  const targetRoute = routeByRole[normalizedRole] || 'login'
  return toEncryptedRoute(targetRoute)
}