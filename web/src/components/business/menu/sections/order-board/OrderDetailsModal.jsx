import {
  extractLineItemNotesFromProductDetails,
  formatProductDetailsForOrderModal,
  orderHasCustomerNotes
} from './orderBoardCustomerNotes.utils'

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null

  const orderNotes = String(order.notes || '').trim()
  const lineItemNotes = extractLineItemNotesFromProductDetails(order.productDetails || '')
  const detailsBody = formatProductDetailsForOrderModal(order.productDetails, order.notes)
  const showNotesSection = orderHasCustomerNotes(order)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[min(92vh,640px)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
        <h4 className="text-base font-semibold text-[#2f2f2f]">{order.productName}</h4>
        <img src={order.productImage} alt={order.productName} className="mt-3 h-44 w-full rounded-lg object-cover" />
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#5f5f5f]">{detailsBody}</p>

        {showNotesSection ? (
          <div className="mt-4 rounded-lg border border-[#ecdfd1] bg-[#fffdfb] p-3">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-[#7d5b3b]">Customer notes</h5>
            {orderNotes ? (
              <div className="mt-2">
                <p className="text-[11px] font-medium text-[#8a7f74]">Order</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#2f2f2f]">{orderNotes}</p>
              </div>
            ) : null}
            {lineItemNotes.length ? (
              <div className={orderNotes ? 'mt-3' : 'mt-2'}>
                <p className="text-[11px] font-medium text-[#8a7f74]">Items</p>
                <ul className="mt-1.5 space-y-2">
                  {lineItemNotes.map((row, i) => (
                    <li key={`${row.lineSummary}-${i}`} className="text-sm text-[#2f2f2f]">
                      <span className="block text-xs text-[#6f665d]">{row.lineSummary}</span>
                      <span className="mt-0.5 block whitespace-pre-wrap">{row.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end">
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

export default OrderDetailsModal
