const TouristTopbar = ({ isProfileOpen, onToggleProfile, avatarFallback, onLogout }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dfd5] bg-[#f8f5f0]/95 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <p className="text-lg font-semibold tracking-tight text-[#9b5a2c] md:text-xl">TARA Bisita Cebu</p>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7a1a] font-semibold text-white shadow-sm transition hover:bg-[#eb6c12]"
          >
            {avatarFallback}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#e7dfd5] bg-white p-2 shadow-lg">
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f5eee4]">
                Profile
              </button>
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
    </header>
  )
}

export default TouristTopbar

