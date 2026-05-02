import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'
import { toEncryptedRoute } from '../../../shared/utils/direct.utils'

const AdminTopbar = ({
  isProfileOpen,
  onToggleProfile,
  onCloseProfile,
  userName,
  avatarFallback,
  onLogout
}) => {
  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (!isProfileOpen) return undefined

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        onCloseProfile()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen, onCloseProfile])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7dfd5] bg-[#f8f5f0]/95 px-4 backdrop-blur-md md:px-6">
      <p className="text-sm font-semibold tracking-[0.16em] text-[#9b5a2c] uppercase">TaraBisita Admin</p>

      <div ref={profileMenuRef} className="relative flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleProfile}
          className="flex items-center gap-2 rounded-full border border-[#e8ded2] bg-white px-2 py-1.5 transition hover:bg-[#f5eee4]"
          title="Admin account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9b5a2c] font-semibold text-white">
            {avatarFallback}
          </span>
          <span className="hidden text-sm font-medium text-[#3f3a35] md:inline">
            {userName || 'Admin'}
          </span>
          <FiChevronDown size={16} className="text-[#7d7164]" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-12 mt-2 w-52 rounded-xl border border-[#e7dfd5] bg-white p-2 shadow-lg">
            <Link
              to={`/${toEncryptedRoute('admin/dashboard')}`}
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

export default AdminTopbar
