import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import { roleBasedRoute } from '../../../shared/utils/direct.utils'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { adminSidebarLinks, getAdminAvatarFallback } from './adminLayout.constants'

const AdminLayout = () => {
  const { user, isAuthenticated, isAuthLoading } = useAuth()
  const logout = useAuthStore((state) => state.logout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({ Business: true })
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const avatarFallback = useMemo(() => getAdminAvatarFallback(user?.name), [user?.name])

  const toggleMenu = (label) => {
    setExpandedMenus((current) => ({ ...current, [label]: !current[label] }))
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/admin/login'
  }

  useEffect(() => {
    setIsProfileOpen(false)
  }, [isSidebarCollapsed])

  if (isAuthLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#f8f5f0] text-sm text-[#5b5b5b]">
        Loading admin session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to={`/${roleBasedRoute(user?.role)}`} replace />
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f8f5f0] text-[#1f1f1f]">
      <AdminSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
        expandedMenus={expandedMenus}
        onToggleMenu={toggleMenu}
        sidebarLinks={adminSidebarLinks}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen((value) => !value)}
          onCloseProfile={() => setIsProfileOpen(false)}
          userName={user?.name}
          avatarFallback={avatarFallback}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
