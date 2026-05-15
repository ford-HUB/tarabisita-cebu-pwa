import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { MainRoutes } from './routes/MainRoutes'
import {
  touristCheckoutHref,
  touristHomeHref,
} from './components/layout/tourist/touristLayout.constants.js'
import { useAuthStore } from './store/auth/auth.store'
import { isGuestCartCheckoutPending } from './shared/utils/guestCartStorage.utils.js'
import { roleBasedRoute } from './shared/utils/direct.utils'
import './index.css'

/** Public URLs hit on first visit (e.g. localhost:5371/) — valid JWT session skips these. */
const PUBLIC_ENTRY_PATHS = new Set(['/', '/home', '/login', '/register'])

const resolveAuthenticatedDestination = (user, search) => {
  const params = new URLSearchParams(search)
  const nextRaw = String(params.get('next') || '').trim()
  const safeNext = nextRaw.startsWith('/') ? nextRaw : ''
  if (safeNext) return safeNext

  const role = String(user?.role || '').toUpperCase()
  if (role === 'TOURIST' && isGuestCartCheckoutPending()) {
    return touristCheckoutHref
  }
  if (role === 'TOURIST') {
    return touristHomeHref
  }
  return `/${roleBasedRoute(user?.role)}`
}

function AppSessionBootstrap() {
  const navigate = useNavigate()
  const location = useLocation()
  const checkUser = useAuthStore((state) => state.checkUser)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCheckedAuth = useAuthStore((state) => state.hasCheckedAuth)
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth)

  const isPublicEntry = PUBLIC_ENTRY_PATHS.has(location.pathname)
  const isAuthPending = isPublicEntry && (!hasCheckedAuth || isCheckingAuth)

  // Validate httpOnly accessToken (JWT) on app entry — not tied to the login form submit.
  useEffect(() => {
    if (!hasCheckedAuth && !isCheckingAuth) {
      void checkUser()
    }
  }, [checkUser, hasCheckedAuth, isCheckingAuth])

  useEffect(() => {
    if (!hasCheckedAuth || !isAuthenticated || !isPublicEntry) return

    navigate(resolveAuthenticatedDestination(user, location.search), { replace: true })
  }, [
    hasCheckedAuth,
    isAuthenticated,
    isPublicEntry,
    location.search,
    navigate,
    user,
  ])

  if (isAuthPending) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-[#f8f5f0]"
        aria-busy="true"
        aria-label="Checking session"
      />
    )
  }

  return <Outlet />
}

const routes = createBrowserRouter([
  {
    element: <AppSessionBootstrap />,
    children: MainRoutes,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{
        className: 'border border-[#ecdcc9] bg-[#fffaf4] text-[#2f2a24] shadow-lg',
        descriptionClassName: 'text-[#6c655d]',
      }}
    />
    <RouterProvider router={routes} />
  </StrictMode>
)
