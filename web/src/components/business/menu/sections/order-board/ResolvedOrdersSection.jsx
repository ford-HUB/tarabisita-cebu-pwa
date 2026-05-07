import { useEffect, useMemo, useState } from 'react'

const FINISHED_VISIBILITY_WINDOW_MS = 5 * 60 * 1000

const getFinishedOrderRemainingMs = (order, nowMs) => {
  if (order.status !== 'FINISHED') return null
  const sourceTime = order.updatedAt || order.createdAt
  const finishedAtMs = new Date(sourceTime).getTime()
  if (!Number.isFinite(finishedAtMs)) return null
  return finishedAtMs + FINISHED_VISIBILITY_WINDOW_MS - nowMs
}

const formatCountdown = (remainingMs) => {
  const clampedSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(clampedSeconds / 60)
  const seconds = clampedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const ResolvedOrdersSection = ({ orders }) => {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(tick)
  }, [])

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const remainingMs = getFinishedOrderRemainingMs(order, nowMs)
        return remainingMs == null || remainingMs > 0
      }),
    [orders, nowMs]
  )

  return (
    <section className="mt-6 rounded-xl border border-[#ecdfd1] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e4d7] bg-[#fff7ee] px-3 py-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Today</p>
          <h4 className="text-sm font-semibold text-[#2f2f2f]">Completed & Canceled Orders</h4>
        </div>
        <span className="rounded-full bg-[#f6efe7] px-2.5 py-1 text-xs font-semibold text-[#7d5b3b]">
          {visibleOrders.length} order(s)
        </span>
      </header>

      {visibleOrders.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-[#8f8377]">No finished or canceled orders for today.</div>
      ) : (
        <div className="max-h-[260px] overflow-y-auto">
          <div className="divide-y divide-[#f2e8dc]">
            {visibleOrders.map((order) => (
              <article
                key={`resolved-${order.id}`}
                className="grid grid-cols-[1fr_1.6fr_1.2fr_0.9fr_0.9fr] items-center gap-2 px-3 py-2 text-xs md:text-sm"
              >
                <p className="font-semibold text-[#7d5b3b]">{order.orderCode || order.id}</p>
                <div className="flex min-w-0 items-center gap-2">
                  <img src={order.productImage} alt={order.productName} className="h-8 w-8 rounded-md object-cover" />
                  <p className="truncate font-medium text-[#2f2f2f]">{order.productName}</p>
                </div>
                <p className="font-medium text-[#2f2f2f]">{order.customer}</p>
                <p className="font-semibold text-[#9b5a2c]">{order.total}</p>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.status === 'CANCELED' ? 'bg-[#fff0f0] text-[#b54747]' : 'bg-[#e8f8ec] text-[#2a7b45]'
                  }`}
                >
                  {order.status === 'CANCELED' ? 'Canceled' : 'Finished'}
                </span>
                {order.status === 'FINISHED' ? (
                  <p className="col-span-full text-[11px] font-semibold text-[#2a7b45]">
                    Auto-hide in {formatCountdown(getFinishedOrderRemainingMs(order, nowMs) || 0)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ResolvedOrdersSection
