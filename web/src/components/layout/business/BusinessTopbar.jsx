import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiChevronDown, FiLogOut, FiSearch, FiSettings, FiUser } from 'react-icons/fi'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    name: 'Terry Franci',
    message: 'requests permission to change Project - Nganter App',
    type: 'Project',
    timeAgo: '5 min ago',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    status: 'active'
  },
  {
    id: 'notif-2',
    name: 'Alena Franci',
    message: 'requests permission to change Project - Nganter App',
    type: 'Project',
    timeAgo: '8 min ago',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    status: 'active'
  },
  {
    id: 'notif-3',
    name: 'Jocelyn Kenter',
    message: 'requests permission to change Project - Nganter App',
    type: 'Project',
    timeAgo: '15 min ago',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=100&q=80',
    status: 'active'
  },
  {
    id: 'notif-4',
    name: 'Brandon Philips',
    message: 'requests permission to change Project - Nganter App',
    type: 'Project',
    timeAgo: '1 hr ago',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    status: 'busy'
  }
]

const BusinessTopbar = ({
  isBusinessVerified,
  isProfileOpen,
  onToggleProfile,
  onCloseProfile,
  userName,
  avatarUrl,
  avatarFallback,
  onLogout
}) => {
  const topbarActionsRef = useRef(null)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarUrl])

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
    setIsNotificationOpen((value) => !value)
    onCloseProfile()
  }

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
          >
            <FiBell size={16} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef4444]" />
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-12 z-40 mt-2 w-[360px] rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-[#f0e7dc] pb-3">
                <h3 className="text-[1.625rem] font-semibold leading-none text-[#3f3a35]">Notification</h3>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="rounded-md p-1.5 text-[#8a7d70] transition hover:bg-[#f5eee4]"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {MOCK_NOTIFICATIONS.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-xl border border-[#f0e7dc] bg-[#fffdfb] px-3 py-3 shadow-[0_1px_4px_rgba(88,62,41,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        <img
                          src={notification.avatar}
                          alt={`${notification.name} avatar`}
                          className="h-full w-full rounded-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            notification.status === 'busy' ? 'bg-[#ef4444]' : 'bg-[#22c55e]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[1.02rem] leading-6 text-[#6a5c4e]">
                          <span className="font-semibold text-[#3f3a35]">{notification.name}</span>{' '}
                          {notification.message}
                        </p>
                        <p className="mt-1 text-sm text-[#9a8d80]">
                          {notification.type} <span className="px-2">&bull;</span> {notification.timeAgo}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-[#e7dfd5] px-4 py-3 text-lg font-semibold text-[#4f463f] transition hover:bg-[#f8f5f1]"
              >
                View All Notification
              </button>
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

