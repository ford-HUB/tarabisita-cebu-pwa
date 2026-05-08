import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useTouristCartItemPersistence } from '../../../hooks/useTouristCartItemPersistence.hook'
import { useAuthStore } from '../../../store/auth/auth.store'
import TouristTopbar from './TouristTopbar'
import TouristAccountModal from './TouristAccountModal'
import { getAvatarFallback, touristShellContentClass } from './touristLayout.constants'

const TouristLayout = () => {
  const { user } = useAuth()
  useTouristCartItemPersistence()
  const logout = useAuthStore((state) => state.logout)
  const [accountModal, setAccountModal] = useState({ open: false, initialView: 'menu' })

  const avatarFallback = useMemo(() => getAvatarFallback(user?.name), [user?.name])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const toggleAccount = () => {
    setAccountModal((prev) =>
      prev.open ? { ...prev, open: false } : { open: true, initialView: 'menu' }
    )
  }

  const closeAccount = () => {
    setAccountModal((prev) => ({ ...prev, open: false }))
  }

  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-[#f8f5f0] text-[#1f1f1f]">
      <TouristTopbar
        onToggleAccount={toggleAccount}
        onCloseAccount={closeAccount}
        avatarUrl={user?.avatar || ''}
        avatarFallback={avatarFallback}
      />

      <TouristAccountModal
        isOpen={accountModal.open}
        initialView={accountModal.initialView}
        onClose={closeAccount}
        onLogout={handleLogout}
      />

      <main className={`${touristShellContentClass} flex-1 py-5 md:py-6 lg:py-8`}>
        <Outlet />
      </main>
    </div>
  )
}

export default TouristLayout
