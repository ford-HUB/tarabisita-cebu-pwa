const AuthFooter = () => {
  return (
    <footer className="bg-[#2b201d] px-6 py-12 text-[#f3e8db] lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 border-b border-[#4d3f39] pb-8 md:grid-cols-3">
          <div>
            <p className="mb-4 text-2xl font-semibold">TARA Bisita Cebu</p>
            <p className="max-w-sm text-sm leading-7 text-[#d8cbc0]">
              Your definitive guide to exploring the beauty, culture, and flavors of Cebu,
              Philippines. Come with us and discover what makes Cebu truly magical.
            </p>
          </div>

          <div className="space-y-3 text-sm text-[#ddd0c5]">
            <a className="block transition hover:text-white" href="/">
              Restaurants
            </a>
            <a className="block transition hover:text-white" href="/">
              Beaches
            </a>
            <a className="block transition hover:text-white" href="/">
              Heritage Sites
            </a>
            <a className="block transition hover:text-white" href="/">
              Hotels &amp; Resorts
            </a>
          </div>

          <div className="space-y-3 text-sm text-[#ddd0c5]">
            <a className="block transition hover:text-white" href="/">
              Claim your listing
            </a>
            <a className="block transition hover:text-white" href="/">
              Owner Dashboard
            </a>
          </div>
        </div>

        <p className="pt-8 text-center text-sm text-[#b9aa9f]">
          &copy; 2026 TARA Bisita Cebu. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default AuthFooter
