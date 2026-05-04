import { useCallback, useState } from 'react'
import { FiChevronDown, FiImage } from 'react-icons/fi'
import TouristCartItemMeta from '../TouristCartItemMeta.jsx'

const ItemDetails = ({ item, formatPhp }) => (
  <div className="mt-2 space-y-1.5 border-t border-[#ece3d9] pt-2 text-xs text-[#5b5b5b]">
    <div className="flex justify-between gap-3">
      <span>Unit price</span>
      <span className="font-medium text-[#1f1f1f]">{formatPhp(item.unitPrice)}</span>
    </div>
    <div className="flex justify-between gap-3">
      <span>Quantity</span>
      <span className="font-medium text-[#1f1f1f]">{item.qty}</span>
    </div>
    <div className="flex justify-between gap-3 border-t border-dashed border-[#e7dfd5] pt-1.5 font-semibold text-[#1f1f1f]">
      <span>Subtotal</span>
      <span className="text-[#ff7a1a]">{formatPhp(item.unitPrice * item.qty)}</span>
    </div>
    {String(item.itemNotes || '').trim() ? (
      <p className="rounded-lg bg-white/80 px-2 py-1.5 text-[11px] leading-snug text-[#3d3d3d]">
        <span className="font-medium text-[#9b5a2c]">Your note: </span>
        {String(item.itemNotes).trim()}
      </p>
    ) : null}
    {item.catalogItemId ? (
      <p className="pt-0.5 text-[10px] leading-snug text-[#a79a8b]">
        Item reference (for support): …{String(item.catalogItemId).slice(-8)}
      </p>
    ) : null}
  </div>
)

const TouristCheckoutCartSection = ({
  groups,
  formatPhp,
  setItemQty,
  removeItem,
  isItemSelected,
  toggleItemSelected
}) => {
  const [openKeys, setOpenKeys] = useState(() => new Set())

  const toggleOpen = useCallback((key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  if (!groups.length) return null

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5" aria-labelledby="checkout-cart-heading">
      <h2 id="checkout-cart-heading" className="text-base font-semibold text-[#1f1f1f]">
        Your cart
      </h2>

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <div key={g.businessId}>
            <p className="text-sm font-medium text-[#9b5a2c]">{g.businessName}</p>
            <ul className="mt-2 space-y-3">
              {g.items.map((item) => {
                const isOpen = openKeys.has(item.key)
                const checked = isItemSelected(item.key)
                return (
                  <li
                    key={item.key}
                    className={`rounded-xl border bg-[#fbf9f6] p-3 shadow-sm ${
                      checked ? 'border-[#e7dfd5]' : 'border-dashed border-[#d4c4b6] opacity-90'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItemSelected(item.key)}
                          className="h-4 w-4 rounded border-[#c4b4a4] text-[#ff7a1a] focus:ring-[#ff7a1a]/30"
                          aria-label={`Include ${item.name} in this checkout`}
                        />
                      </div>

                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#ece3d9]">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[#a79a8b]">
                            <FiImage className="h-5 w-5" aria-hidden />
                            <span className="text-[9px] font-medium uppercase tracking-wide">No photo</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleOpen(item.key)}
                          className="flex w-full min-w-0 items-center gap-2 rounded-lg text-left text-[#1f1f1f] outline-none ring-[#ff7a1a] transition hover:bg-white/60 focus-visible:ring-2"
                          aria-expanded={isOpen}
                          aria-controls={`item-details-${item.key}`}
                          id={`item-toggle-${item.key}`}
                        >
                          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{item.name}</span>
                          <FiChevronDown
                            className={`h-4 w-4 shrink-0 text-[#9b5a2c] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </button>
                        <TouristCartItemMeta item={item} />
                        {!isOpen ? (
                          <p className="mt-0.5 text-xs text-[#5b5b5b]">{formatPhp(item.unitPrice)} each</p>
                        ) : null}
                        {isOpen ? (
                          <div id={`item-details-${item.key}`} role="region" aria-labelledby={`item-toggle-${item.key}`}>
                            <ItemDetails item={item} formatPhp={formatPhp} />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <label className="sr-only" htmlFor={`qty-${item.key}`}>
                          Quantity for {item.name}
                        </label>
                        <input
                          id={`qty-${item.key}`}
                          type="number"
                          min={1}
                          max={99}
                          value={item.qty}
                          onChange={(e) => setItemQty(item.key, e.target.value)}
                          className="w-16 rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-center text-sm font-medium text-[#1f1f1f] outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/25"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fee4e2]"
                        >
                          Remove
                        </button>
                        <p className="text-sm font-semibold text-[#ff7a1a]">{formatPhp(item.unitPrice * item.qty)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TouristCheckoutCartSection
