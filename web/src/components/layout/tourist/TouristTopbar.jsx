import { useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { FiCompass, FiMessageCircle, FiShoppingBag, FiShoppingCart } from 'react-icons/fi'
import { isSignedRouteValid } from '../../../shared/utils/direct.utils'
import { useTouristCartItemStore } from '../../../store/tourist/tourist-cart-item.store.js'
import {
  touristCartHref,
  touristExploreHref,
  touristHistoryHref,
  touristMessagesHref,
  touristOrdersHref,
  touristShellContentClass
} from './touristLayout.constants'

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-4',
    isActive
      ? 'bg-[#f5eee4] text-[#9b5a2c] shadow-sm ring-1 ring-[#e7dfd5]'
      : 'text-[#5b5b5b] hover:bg-white/80 hover:text-[#1f1f1f]'
  ].join(' ')

const TouristTopbar = ({ isProfileOpen, onToggleProfile, onCloseProfile, avatarFallback, onLogout }) => {
  const location = useLocation()
  const profileWrapRef = useRef(null)
  const cartCount = useTouristCartItemStore((s) => s.items.reduce((acc, it) => acc + it.qty, 0))
  const pathSeg = (location.pathname || '').replace(/^\/+/, '')
  const routeKey = new URLSearchParams(location.search).get('rk')
  const messagesActive = pathSeg === 'tourist/messages' && isSignedRouteValid('tourist/messages', routeKey)

  useEffect(() => {
    if (!isProfileOpen) return undefined

    const handleClickOutside = (event) => {
      if (profileWrapRef.current && !profileWrapRef.current.contains(event.target)) {
        onCloseProfile?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen, onCloseProfile])

  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dfd5] bg-[#f8f5f0]/95 backdrop-blur-md">
      <div
        className={`${touristShellContentClass} flex min-w-0 items-center gap-3 py-3 md:gap-6`}
      >
        <Link
          to={touristExploreHref}
          onClick={() => onCloseProfile?.()}
          className="flex min-w-0 flex-1 items-center gap-2 text-[#9b5a2c]"
        >
          <img src="/web-logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" width={36} height={36} />
          <span className="truncate text-base font-semibold tracking-tight sm:text-lg md:text-xl">TARA Bisita Cebu</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <nav
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Primary"
            onClick={() => onCloseProfile?.()}
          >
            <NavLink to={touristExploreHref} end className={navLinkClass} title="Explore">
              <FiCompass className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Explore</span>
            </NavLink>
            <NavLink to={touristCartHref} className={navLinkClass} title="Cart">
              <span className="relative inline-flex">
                <FiShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7a1a] px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </span>
              <span className="hidden sm:inline">Cart</span>
            </NavLink>
            <NavLink to={touristOrdersHref} className={navLinkClass} title="Orders">
              <FiShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </NavLink>
            <Link
              to={touristMessagesHref}
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-4',
                messagesActive
                  ? 'bg-[#f5eee4] text-[#9b5a2c] shadow-sm ring-1 ring-[#e7dfd5]'
                  : 'text-[#5b5b5b] hover:bg-white/80 hover:text-[#1f1f1f]'
              ].join(' ')}
              title="Messages"
            >
              <FiMessageCircle className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Messages</span>
            </Link>
          </nav>

          <div ref={profileWrapRef} className="relative">
          <button
            type="button"
            onClick={onToggleProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7a1a] font-semibold text-white shadow-sm transition hover:bg-[#eb6c12]"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            {avatarFallback}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#e7dfd5] bg-white p-2 shadow-lg">
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f5eee4]">
                Profile
              </button>
              <Link
                to={touristHistoryHref}
                onClick={() => onCloseProfile?.()}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#1f1f1f] hover:bg-[#f5eee4]"
              >
                history
              </Link>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f5eee4]">
                Settings
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fee4e2]"
              >
                Logout
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TouristTopbar
