import { orderHasCustomerNotes } from './orderBoardCustomerNotes.utils'

const CollapsedOrderList = ({
  columnTitle,
  orders,
  onOpenDetails,
  isRestaurantAccount = false,
  onOpenCustomerNotes,
  onAdvanceStatus,
  onOpenCancelModal
}) => {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [touch-action:pan-y]"
      aria-label={`${columnTitle} orders`}
    >
      {orders.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-[#8f8377]">No orders yet</p>
      ) : null}
      {orders.map((order) => (
        <article key={order.id} className="mb-2 rounded-lg border border-[#ecdfd1] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-[#7d5b3b]">{order.orderCode || order.id}</p>
              <p className="text-xs text-[#8a7f74]">{order.time}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <img src={order.productImage} alt={order.productName} className="h-10 w-10 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2f2f2f]">{order.productName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(order)}
                    className="text-[11px] text-[#9b5a2c] hover:underline"
                  >
                    View details
                  </button>
                  {isRestaurantAccount && orderHasCustomerNotes(order) ? (
                    <button
                      type="button"
                      onClick={() => onOpenCustomerNotes?.(order)}
                      className="text-[11px] font-semibold text-[#7d5b3b] hover:underline"
                    >
                      Customer notes
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#2f2f2f]">{order.customer}</p>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#6f665d]">
              <span>{order.items} item(s)</span>
              <span className="font-semibold text-[#9b5a2c]">{order.total}</span>
            </div>
            {order.status === 'PLACED' ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(order.id)}
                  className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-xs font-semibold text-[#9b5a2c] transition hover:bg-[#ffe2c8]"
                >
                  Mark as Processing
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCancelModal(order)}
                  className="rounded-full bg-[#fff0f0] px-2.5 py-1 text-xs font-semibold text-[#b54747] transition hover:bg-[#ffe1e1]"
                >
                  Cancel Order
                </button>
              </div>
            ) : order.status === 'PROCESSING' ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(order.id)}
                  className="rounded-full bg-[#fff8dd] px-2.5 py-1 text-xs font-semibold text-[#9c6a12] transition hover:bg-[#ffefb8]"
                >
                  Mark as Finished
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCancelModal(order)}
                  className="rounded-full bg-[#fff0f0] px-2.5 py-1 text-xs font-semibold text-[#b54747] transition hover:bg-[#ffe1e1]"
                >
                  Cancel Order
                </button>
              </div>
            ) : order.status === 'CANCELED' ? (
              <span className="mt-2 inline-flex rounded-full bg-[#fff0f0] px-2.5 py-1 text-xs font-semibold text-[#b54747]">
                Canceled
              </span>
            ) : (
              <span className="mt-2 inline-flex rounded-full bg-[#e8f8ec] px-2.5 py-1 text-xs font-semibold text-[#2a7b45]">
                Completed
              </span>
            )}
        </article>
      ))}
    </div>
  )
}

export default CollapsedOrderList
