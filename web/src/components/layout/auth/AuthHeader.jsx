const AuthHeader = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between overflow-hidden border-b border-white/35 bg-white/25 px-6 py-3 backdrop-blur-md lg:px-10">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain md:h-10 md:w-10"
          />
          <p className="text-xl font-semibold text-[#9b5a2c]">TARA Bisita Cebu</p>
        </div>
        <nav className="hidden gap-6 text-sm md:flex">
          <a className="text-[#1f1f1f] transition hover:text-[#c66b2b]" href="/">
            Home
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <a className="px-2 py-1 text-[#1f1f1f] transition hover:text-[#c66b2b]" href="/login">
          Login
        </a>
        <a
          className="rounded-full bg-[#ff7a1a] px-4 py-1.5 font-medium text-white transition hover:bg-[#eb6c12]"
          href="/register"
        >
          Register
        </a>
      </div>
    </header>
  )
}

export default AuthHeader
