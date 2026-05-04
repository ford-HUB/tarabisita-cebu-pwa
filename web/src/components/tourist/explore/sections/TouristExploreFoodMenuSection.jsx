const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TouristExploreFoodMenuSection = ({
  foodMenuCategory,
  onFoodMenuCategoryChange,
  categories,
  items,
  isLoading,
  errorMessage,
  onOpenMenuItem
}) => {
  const selectId = 'tourist-food-menu-category'

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-6" aria-labelledby="tourist-food-menu-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="tourist-food-menu-heading" className="text-lg font-semibold tracking-tight text-[#1f1f1f] md:text-xl">
            Menu from partners
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#5b5b5b]">
            Dishes posted by verified business accounts. Only items marked available to order are listed.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-56 lg:hidden">
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-[#a79a8b]">
            Food type
          </label>
          <select
            id={selectId}
            value={foodMenuCategory}
            onChange={(e) => onFoodMenuCategoryChange(e.target.value)}
            className="mt-1.5 w-full cursor-pointer rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] px-3 py-2.5 text-sm font-medium text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/25"
          >
            <option value="ALL">All types</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-[#fecdca] bg-[#fff4f2] p-3 text-sm text-[#7a271a]">{errorMessage}</p>
      ) : null}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="animate-pulse overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f5eee4]">
              <div className="aspect-[4/3] bg-[#ece3d9]" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-[75%] rounded bg-[#ece3d9]" />
                <div className="h-3 w-1/2 rounded bg-[#ece3d9]" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !items.length ? (
        <p className="mt-6 rounded-xl border border-[#e7dfd5] bg-[#fbf9f6] p-4 text-sm text-[#5b5b5b]">
          No available dishes match this type yet. Try &quot;All types&quot; or check back when partners publish their
          menu.
        </p>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const img = Array.isArray(item.images) && item.images.length ? item.images[0] : null
            const showAvailable = Boolean(item.isAvailable) && item.stockStatus !== 'OUT_OF_STOCK'
            return (
              <li key={`${item.businessId}-${item.id}`}>
                <button
                  type="button"
                  onClick={() => onOpenMenuItem?.(item)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] text-left shadow-sm transition hover:border-[#d4c4b6] hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ece3d9]">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#a79a8b]">
                        No photo
                      </div>
                    )}
                    {showAvailable ? (
                      <span className="absolute right-2 top-2 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                        Available
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-[#1f1f1f]">{item.name}</p>
                    <p className="text-xs text-[#5b5b5b]">{item.businessName}</p>
                    {item.category ? (
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9b5a2c]">{item.category}</p>
                    ) : null}
                    <p className="mt-auto pt-1 text-sm font-semibold text-[#ff7a1a]">{formatPrice(item.price)}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default TouristExploreFoodMenuSection
