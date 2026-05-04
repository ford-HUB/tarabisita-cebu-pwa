import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiBell, FiChevronDown, FiLogOut, FiSearch, FiSettings, FiUser } from 'react-icons/fi'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'
import BusinessNotificationCardsSection from '../../business/notifications/sections/BusinessNotificationCardsSection'
import { businessNotificationsHref } from './businessLayout.constants'

const BusinessTopbar = ({
  isBusinessVerified,
  isProfileOpen,
  onToggleProfile,
  onCloseProfile,
  userName,
  avatarUrl,
  avatarFallback,
  onLogout,
  storeUnreadCount = 0,
  notificationItems = [],
  notificationsLoading = false,
  notificationsError = null,
  onNotificationsPanelOpened,
  onNotificationsPanelClosed
}) => {
  const location = useLocation()
  const topbarActionsRef = useRef(null)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const prevNotificationOpenRef = useRef(false)

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarUrl])

  useEffect(() => {
    setIsNotificationOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (prevNotificationOpenRef.current && !isNotificationOpen) {
      onNotificationsPanelClosed?.()
    }
    prevNotificationOpenRef.current = isNotificationOpen
  }, [isNotificationOpen, onNotificationsPanelClosed])

  useEffect(() => {
    if (!isProfileOpen && !isNotificationOpen) return undefined

    const handleClickOutside = (event) => {
      if (topbarActionsRef.current && !topbarActionsRef.current.contains(event.target)) {
        onCloseProfile()
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationOpen, isProfileOpen, onCloseProfile])

  const handleToggleNotifications = () => {
    setIsNotificationOpen((value) => {
      const next = !value
      if (next) {
        onNotificationsPanelOpened?.()
      }
      return next
    })
    onCloseProfile()
  }

  const unreadCount = Number(storeUnreadCount) || 0
  const showUnreadBadge = unreadCount > 0 && !isNotificationOpen
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7dfd5] bg-[#f8f5f0]/95 px-4 backdrop-blur-md md:px-6">
      <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-[#e8ded2] bg-white px-3 py-2 md:flex">
        <FiSearch size={16} className="text-[#918579]" />
        <input
          type="text"
          placeholder="Search or type command..."
          className="w-full border-none bg-transparent text-sm text-[#3f3a35] outline-none placeholder:text-[#9f9387]"
        />
      </div>

      <div ref={topbarActionsRef} className="relative flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`relative rounded-full border p-2 text-[#7d7164] transition ${
              isNotificationOpen
                ? 'border-[#d5c5b2] bg-[#f5eee4]'
                : 'border-[#e8ded2] bg-white hover:bg-[#f5eee4]'
            }`}
            title="Notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            <FiBell size={16} />
            {showUnreadBadge ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[0.65rem] font-bold leading-none text-white">
                {badgeLabel}
              </span>
            ) : null}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-12 z-40 mt-2 w-[360px] rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-[#f0e7dc] pb-3">
                <h3 className="text-[1.625rem] font-semibold leading-none text-[#3f3a35]">Notifications</h3>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="rounded-md p-1.5 text-[#8a7d70] transition hover:bg-[#f5eee4]"
                  aria-label="Close notifications"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              <BusinessNotificationCardsSection
                items={notificationItems}
                isLoading={notificationsLoading}
                errorMessage={notificationsError}
                variant="dropdown"
                onItemNavigate={() => setIsNotificationOpen(false)}
              />

              <Link
                to={businessNotificationsHref}
                onClick={() => setIsNotificationOpen(false)}
                className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] px-4 py-3 text-sm font-semibold text-[#4f463f] transition hover:border-[#d5c5b2] hover:bg-[#f5eee4]"
              >
                See more
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNotificationOpen(false)
            onToggleProfile()
          }}
          className={`flex items-center gap-2 rounded-full border px-2 py-1.5 transition ${
            isBusinessVerified
              ? 'border-[#ffd8bd] bg-[#fff5eb] hover:bg-[#fef0e4]'
              : 'border-[#f3c6c2] bg-[#fff2f1] hover:bg-[#fee4e2]'
          }`}
          title={isBusinessVerified ? 'Verified business account' : 'Business verification required'}
        >
          {avatarUrl && !avatarLoadFailed ? (
            <img
              src={avatarUrl}
              alt={userName ? `${userName} profile` : 'Business profile'}
              onError={() => setAvatarLoadFailed(true)}
              className="h-8 w-8 rounded-full border border-[#ffffffb8] object-cover"
            />
          ) : (
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white ${
                isBusinessVerified ? 'bg-[#ff7a1a]' : 'bg-[#d92d20]'
              }`}
            >
              {avatarFallback}
            </span>
          )}
          <span className="hidden text-sm font-medium text-[#3f3a35] md:inline">
            {userName || 'Business'}
          </span>
          <FiChevronDown size={16} className="text-[#7d7164]" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-12 mt-2 w-52 rounded-xl border border-[#e7dfd5] bg-white p-2 shadow-lg">
            <Link
              to={`/${toEncryptedRoute('business/dashboard/profile')}`}
              onClick={onCloseProfile}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f5eee4]"
            >
              <FiUser size={15} />
              Profile
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f5eee4]"
            >
              <FiSettings size={15} />
              Settings
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fee4e2]"
            >
              <FiLogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default BusinessTopbar
