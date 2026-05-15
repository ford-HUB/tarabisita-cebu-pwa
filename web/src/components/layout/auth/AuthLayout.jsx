import { Outlet } from 'react-router-dom'
import AuthFooter from './AuthFooter'
import AuthHeader from './AuthHeader'
import { useGuestCartPersistence } from '../../../hooks/useGuestCartPersistence.hook.js'

const AuthLayout = () => {
  useGuestCartPersistence()

  return (
    <div className="bg-[#f8f5f0] text-[#1f1f1f]">
      <AuthHeader />
      <main>
        <Outlet />
      </main>
      <AuthFooter />
    </div>
  )
}

export default AuthLayout
