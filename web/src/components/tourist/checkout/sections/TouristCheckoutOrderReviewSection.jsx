import { Link } from 'react-router-dom'
import { FiImage, FiTrash2 } from 'react-icons/fi'
import TouristCartItemMeta from '../TouristCartItemMeta.jsx'
import { isTouristCartStayListing } from '../../../../shared/utils/tourist-cart-item-details.utils.js'

const MAX_ITEM_NOTES = 500

const TouristCheckoutOrderReviewSection = ({ groups, formatPhp, editCartHref, onEditCartClick, setItemNotes, removeItem }) => {
  if (!groups.length) return null

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5" aria-labelledby="checkout-order-review-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="checkout-order-review-heading" className="text-base font-semibold text-[#1f1f1f]">
          Your order
        </h2>
        <Link
          to={editCartHref}
          onClick={() => onEditCartClick?.()}
          className="text-sm font-semibold text-[#9b5a2c] underline decoration-[#e7dfd5] underline-offset-2 transition hover:text-[#ff7a1a]"
        >
          Edit
        </Link>
      </div>
      <p className="mt-1 text-xs text-[#5b5b5b]">
        Review what you selected. Add optional notes per item (for example spice level or allergies). To change items
        or quantities, use Edit.
      </p>

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <div key={g.businessId}>
            <p className="text-sm font-medium text-[#9b5a2c]">{g.businessName}</p>
            <ul className="mt-2 space-y-2">
              {g.items.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 rounded-xl border border-[#efe6dc] bg-[#fbf9f6] p-2.5"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e7dfd5] bg-[#ece3d9]">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#a79a8b]">
                        <FiImage className="h-4 w-4" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f1f1f]">{item.name}</p>
                    <TouristCartItemMeta item={item} density="compact" />
                    <p className="mt-0.5 text-xs text-[#5b5b5b]">
                      {isTouristCartStayListing(item) ? (
                        <>
                          {Number(item.qty) > 1 ? `${item.qty} nights · ` : null}
                          {formatPhp(item.unitPrice)} per night
                        </>
                      ) : (
                        <>
                          Qty {item.qty} · {formatPhp(item.unitPrice)} each
                        </>
                      )}
                    </p>
                    <label className="mt-2 block text-xs font-medium text-[#3d3d3d]" htmlFor={`item-notes-${item.key}`}>
                      Note for this item
                      <textarea
                        id={`item-notes-${item.key}`}
                        rows={2}
                        maxLength={MAX_ITEM_NOTES}
                        value={item.itemNotes ?? ''}
                        onChange={(e) => setItemNotes(item.key, e.target.value)}
                        placeholder="e.g. No onions, extra sauce…"
                        className="mt-1 w-full resize-y rounded-lg border border-[#e7dfd5] bg-white px-2.5 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a79a8b] focus:border-[#9b5a2c] focus:outline-none focus:ring-1 focus:ring-[#9b5a2c]"
                      />
                      <span className="mt-0.5 block text-[10px] font-normal text-[#8b8b8b]">
                        {(item.itemNotes ?? '').length}/{MAX_ITEM_NOTES}
                      </span>
                    </label>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="rounded-lg p-1.5 text-[#9b5a2c] transition hover:bg-[#fee4e2] hover:text-[#b42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]/35"
                      aria-label={`Remove ${item.name} from order`}
                    >
                      <FiTrash2 className="h-4 w-4" aria-hidden />
                    </button>
                    <p className="text-sm font-semibold text-[#ff7a1a]">{formatPhp(item.unitPrice * item.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TouristCheckoutOrderReviewSection
