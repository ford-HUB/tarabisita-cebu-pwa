import { motion } from 'motion/react'

const CollapsedOrderList = ({
  columnTitle,
  columnKey,
  orders,
  loopOrders,
  isHovered,
  setHoveredColumnKey,
  autoRollSecondsPerItem,
  onOpenDetails,
  onAdvanceStatus,
  onOpenCancelModal
}) => {
  return (
    <div
      onMouseEnter={() => setHoveredColumnKey(columnKey)}
      onMouseLeave={() => setHoveredColumnKey((current) => (current === columnKey ? null : current))}
      className="max-h-[332px] overflow-y-auto pr-1 [scrollbar-width:thin] [touch-action:pan-y]"
      aria-label={`${columnTitle} rolling orders`}
    >
      <motion.div
        initial={false}
        animate={orders.length > 1 && !isHovered ? { y: ['0%', '-66.6667%'] } : undefined}
        transition={
          orders.length > 1
            ? {
                duration: Math.max(20, orders.length * autoRollSecondsPerItem),
                ease: 'linear',
                repeat: Number.POSITIVE_INFINITY
              }
            : undefined
        }
      >
        {loopOrders.map((order, index) => (
          <article key={`${order.id}-${index}`} className="mb-2 rounded-lg border border-[#ecdfd1] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-[#7d5b3b]">{order.id}</p>
              <p className="text-xs text-[#8a7f74]">{order.time}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <img src={order.productImage} alt={order.productName} className="h-10 w-10 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2f2f2f]">{order.productName}</p>
                <button
                  type="button"
                  onClick={() => onOpenDetails(order)}
                  className="text-[11px] text-[#9b5a2c] hover:underline"
                >
                  View details
                </button>
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
      </motion.div>
    </div>
  )
}

export default CollapsedOrderList
