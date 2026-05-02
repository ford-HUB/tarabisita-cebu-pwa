import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessAccess } from '../../../hooks/useBusinessAccess.hook'
import { useAuthStore } from '../../../stores/auth/auth.store'
import BusinessSidebar from './BusinessSidebar'
import BusinessTopbar from './BusinessTopbar'
import BusinessVerificationModal from './BusinessVerificationModal'
import { buildBusinessSidebarLinks, getAvatarFallback } from './businessLayout.constants'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

const BusinessLayout = () => {
  const { user } = useAuth()
  const { isProfileComplete, isBusinessVerified } = useBusinessAccess(user)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const avatarUrl = user?.avatar || ''
  const profilePath = `/${toEncryptedRoute('business/dashboard/profile')}`

  const avatarFallback = useMemo(() => getAvatarFallback(user?.name), [user?.name])
  const sidebarLinks = useMemo(
    () => buildBusinessSidebarLinks(user?.businessCategory),
    [user?.businessCategory]
  )

  useEffect(() => {
    const firstCollapsibleMenu = sidebarLinks.find((menu) => Array.isArray(menu.children))
    if (!firstCollapsibleMenu) return

    setExpandedMenus((current) => ({
      ...current,
      [firstCollapsibleMenu.label]: current[firstCollapsibleMenu.label] ?? true
    }))
  }, [sidebarLinks])

  const toggleMenu = (label) => {
    setExpandedMenus((current) => ({ ...current, [label]: !current[label] }))
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  useEffect(() => {
    if (!isProfileComplete && location.pathname !== profilePath) {
      navigate(profilePath, { replace: true })
    }
  }, [isProfileComplete, location.pathname, navigate, profilePath])

  useEffect(() => {
    // Re-open every refresh until verification is approved.
    setIsVerificationModalOpen(!isBusinessVerified)
  }, [isBusinessVerified])

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f8f5f0] text-[#1f1f1f]">
      <BusinessSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
        expandedMenus={expandedMenus}
        onToggleMenu={toggleMenu}
        sidebarLinks={sidebarLinks}
        isRestricted={!isProfileComplete}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <BusinessTopbar
          isBusinessVerified={isBusinessVerified}
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen((value) => !value)}
          onCloseProfile={() => setIsProfileOpen(false)}
          userName={user?.name}
          avatarUrl={avatarUrl}
          avatarFallback={avatarFallback}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <BusinessVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitProof={() => {
          setIsVerificationModalOpen(false)
          navigate(`/${toEncryptedRoute('business/dashboard/profile')}`)
        }}
      />
    </div>
  )
}

export default BusinessLayout
