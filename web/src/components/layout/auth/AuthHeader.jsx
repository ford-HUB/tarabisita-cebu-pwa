import { Link } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import { useGuestCartStore } from '../../../store/guest/guest-cart.store.js'
import { publicCartHref } from '../../../shared/constants/guestCart.constants.js'

const AuthHeader = () => {
  const cartCount = useGuestCartStore((s) => s.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0))

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between overflow-hidden border-b border-white/35 bg-white/25 px-6 py-3 backdrop-blur-md lg:px-10">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain md:h-10 md:w-10"
          />
          <p className="text-xl font-semibold text-[#9b5a2c]">TARA Bisita Cebu</p>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <Link className="text-[#1f1f1f] transition hover:text-[#c66b2b]" to="/">
            Home
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link
          to={publicCartHref}
          className="relative inline-flex items-center gap-1.5 rounded-full border border-[#e7dfd5]/80 bg-white/70 px-3 py-1.5 font-medium text-[#1f1f1f] transition hover:border-[#ff7a1a] hover:text-[#c66b2b]"
          title="Cart"
        >
          <FiShoppingCart className="h-[1.15rem] w-[1.15rem]" aria-hidden />
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7a1a] px-1 text-[10px] font-bold text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </Link>
        <Link className="px-2 py-1 text-[#1f1f1f] transition hover:text-[#c66b2b]" to="/login">
          Login
        </Link>
        <Link
          className="rounded-full bg-[#ff7a1a] px-4 py-1.5 font-medium text-white transition hover:bg-[#eb6c12]"
          to="/register"
        >
          Register
        </Link>
      </div>
    </header>
  )
}

export default AuthHeader
