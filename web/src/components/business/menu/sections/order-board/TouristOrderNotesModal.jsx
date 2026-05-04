import { extractLineItemNotesFromProductDetails } from './orderBoardCustomerNotes.utils'

const TouristOrderNotesModal = ({ order, onClose }) => {
  if (!order) return null

  const orderNotes = String(order.notes || '').trim()
  const lineNotes = extractLineItemNotesFromProductDetails(order.productDetails || '')

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div
        className="max-h-[min(90vh,520px)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl"
        role="dialog"
        aria-labelledby="tourist-order-notes-title"
        aria-modal="true"
      >
        <h4 id="tourist-order-notes-title" className="text-base font-semibold text-[#2f2f2f]">
          Customer notes
        </h4>
        <p className="mt-1 text-xs text-[#8a7f74]">
          Order {order.orderCode || order.id} · {order.customer}
        </p>

        <div className="mt-4 space-y-4 text-sm text-[#3f3f3f]">
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-[#7d5b3b]">Order note</h5>
            {orderNotes ? (
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-[#ecdfd1] bg-[#fffdfb] p-3 text-[#2f2f2f]">
                {orderNotes}
              </p>
            ) : (
              <p className="mt-1.5 text-[#8f8377]">No order-wide note.</p>
            )}
          </section>

          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-[#7d5b3b]">Item notes</h5>
            {lineNotes.length ? (
              <ul className="mt-1.5 space-y-2">
                {lineNotes.map((row, i) => (
                  <li key={`${row.lineSummary}-${i}`} className="rounded-lg border border-[#ecdfd1] bg-[#fffdfb] p-3">
                    <p className="text-xs text-[#6f665d]">{row.lineSummary}</p>
                    <p className="mt-1 whitespace-pre-wrap font-medium text-[#2f2f2f]">{row.note}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[#8f8377]">No per-item notes.</p>
            )}
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#ff7a1a] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#ee6d0f]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TouristOrderNotesModal
