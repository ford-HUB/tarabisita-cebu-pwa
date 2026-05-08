import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessAccess } from '../../../hooks/useBusinessAccess.hook'
import { useBusinessStoreNotifications } from '../../../hooks/useBusinessStoreNotifications.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import BusinessSidebar from './BusinessSidebar'
import BusinessTopbar from './BusinessTopbar'
import BusinessVerificationModal from './BusinessVerificationModal'
import { buildBusinessSidebarLinks, getAvatarFallback } from './businessLayout.constants'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

const BusinessLayout = () => {
  const { user } = useAuth()
  const checkUser = useAuthStore((state) => state.checkUser)
  const { isBusinessVerified } = useBusinessAccess(user)
  const {
    unreadCount: storeUnreadCount,
    notificationItems,
    notificationsLoading,
    notificationsError,
    onNotificationsPanelOpened,
    onNotificationsPanelClosed
  } = useBusinessStoreNotifications()
  /** Unverified businesses may only use User Profile (DB status via check-user + profile API). */
  const isOperationsLocked = !isBusinessVerified
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
    void checkUser({ silent: true })
  }, [checkUser])

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

  const isOnBaseProfilePage =
    location.pathname === '/business/dashboard/profile' &&
    new URLSearchParams(location.search).get('view') !== 'activity'
  const isOnSettingsPage = location.pathname === '/business/dashboard/settings'
  const isAllowedRestrictedPage = isOnBaseProfilePage || isOnSettingsPage

  useEffect(() => {
    if (isOperationsLocked && !isAllowedRestrictedPage) {
      navigate(profilePath, { replace: true })
    }
  }, [isOperationsLocked, isAllowedRestrictedPage, navigate, profilePath])

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
        isRestricted={isOperationsLocked}
        profileHref={profilePath}
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
          storeUnreadCount={storeUnreadCount}
          notificationItems={notificationItems}
          notificationsLoading={notificationsLoading}
          notificationsError={notificationsError}
          onNotificationsPanelOpened={onNotificationsPanelOpened}
          onNotificationsPanelClosed={onNotificationsPanelClosed}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
          {!isOperationsLocked || isAllowedRestrictedPage ? (
            <Outlet />
          ) : null}
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
