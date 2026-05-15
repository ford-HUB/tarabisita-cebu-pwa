import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { FiCompass, FiHome, FiMessageCircle, FiShoppingBag, FiShoppingCart } from 'react-icons/fi'
import { isSignedRouteValid } from '../../../shared/utils/direct.utils'
import { useTouristCartItemStore } from '../../../store/tourist/tourist-cart-item.store.js'
import {
  touristCartHref,
  touristExploreHref,
  touristHomeHref,
  touristMessagesHref,
  touristOrdersHref,
  touristShellContentClass
} from './touristLayout.constants'
import TouristAccountModal from './TouristAccountModal.jsx'

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-4',
    isActive
      ? 'bg-[#f5eee4] text-[#9b5a2c] shadow-sm ring-1 ring-[#e7dfd5]'
      : 'text-[#5b5b5b] hover:bg-white/80 hover:text-[#1f1f1f]'
  ].join(' ')

const exploreOwnedNavPaths = new Set([
  'tourist/explore/cart',
  'tourist/explore/checkout',
  'tourist/explore/stay-booking'
])

const exploreNavIsActive = ({ isActive }, pathSeg) =>
  isActive && !exploreOwnedNavPaths.has(pathSeg)

const TouristTopbar = ({
  accountOpen = false,
  accountInitialView = 'menu',
  onToggleAccount,
  onCloseAccount,
  onLogout,
  avatarUrl,
  avatarFallback
}) => {
  const location = useLocation()
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarUrl])
  const cartCount = useTouristCartItemStore((s) => s.items.reduce((acc, it) => acc + it.qty, 0))
  const pathSeg = (location.pathname || '').replace(/^\/+/, '')
  const suppressCartCountBadge =
    pathSeg.startsWith('tourist/explore/business/') ||
    pathSeg === 'tourist/explore/checkout' ||
    pathSeg === 'tourist/explore/cart'
  const routeKey = new URLSearchParams(location.search).get('rk')
  const messagesActive = pathSeg === 'tourist/messages' && isSignedRouteValid('tourist/messages', routeKey)

  return (
    <header className="sticky top-0 z-30 overflow-visible border-b border-[#e7dfd5] bg-[#f8f5f0]/95 backdrop-blur-md">
      <div
        className={`${touristShellContentClass} flex min-w-0 items-center gap-3 py-3 md:gap-6`}
      >
        <Link
          to={touristHomeHref}
          onClick={() => onCloseAccount?.()}
          className="flex min-w-0 flex-1 items-center gap-2 text-[#9b5a2c]"
        >
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" width={36} height={36} />
          <span className="truncate text-base font-semibold tracking-tight sm:text-lg md:text-xl">TARA Bisita Cebu</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <nav
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Primary"
            onClick={() => onCloseAccount?.()}
          >
            <NavLink to={touristHomeHref} end className={navLinkClass} title="Home">
              <FiHome className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink
              to={touristExploreHref}
              className={(state) => navLinkClass({ isActive: exploreNavIsActive(state, pathSeg) })}
              title="Explore"
            >
              <FiCompass className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Explore</span>
            </NavLink>
            <NavLink to={touristCartHref} className={navLinkClass} title="Cart">
              <span className="relative inline-flex">
                <FiShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
                {!suppressCartCountBadge && cartCount > 0 ? (
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

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => onToggleAccount?.()}
              className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] ${
                accountOpen ? 'ring-2 ring-[#9b5a2c] ring-offset-2 ring-offset-[#f8f5f0] bg-[#eb6c12]' : 'bg-[#ff7a1a]'
              }`}
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              aria-label="Account menu"
            >
              {avatarUrl && !avatarLoadFailed ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                avatarFallback
              )}
            </button>
            <TouristAccountModal
              isOpen={accountOpen}
              initialView={accountInitialView}
              onClose={onCloseAccount}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default TouristTopbar
