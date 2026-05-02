import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useAuthStore } from '../../../stores/auth/auth.store'
import TouristTopbar from './TouristTopbar'
import { getAvatarFallback } from './touristLayout.constants'

const TouristLayout = () => {
  const { user } = useAuth()
  const logout = useAuthStore((state) => state.logout)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const avatarFallback = useMemo(() => getAvatarFallback(user?.name), [user?.name])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0] text-[#1f1f1f]">
      <TouristTopbar
        isProfileOpen={isProfileOpen}
        onToggleProfile={() => setIsProfileOpen((value) => !value)}
        avatarFallback={avatarFallback}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default TouristLayout
