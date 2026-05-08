import { useMemo } from 'react'
import { useBusinessTrafficInsights } from '../../../hooks/useBusinessTrafficInsights.hook.js'

const percent = (value) => `${Number(value || 0).toFixed(2)}%`

const TrafficInsights = () => {
  const { data, summary, ordersByHour, selectedDate, setSelectedDate, isLoading, errorMessage, refreshInsights } =
    useBusinessTrafficInsights()
  const isBookingReport = data?.reportBasis === 'bookings'
  const unitLabel = isBookingReport ? 'Booking' : 'Order'
  const unitLabelPlural = `${unitLabel}s`

  const generatedLabel = useMemo(() => {
    if (!data?.generatedAt) return ''
    const date = new Date(data.generatedAt)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
  }, [data?.generatedAt])

  const peakHour = useMemo(() => {
    if (!ordersByHour.length) return null
    return ordersByHour.reduce((best, row) => (row.orders > (best?.orders || -1) ? row : best), null)
  }, [ordersByHour])

  const maxOrders = useMemo(() => Math.max(1, ...ordersByHour.map((row) => Number(row.orders) || 0)), [ordersByHour])

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Traffic Insights</h1>
        <p className="mt-1 text-sm text-[#6d645d]">
          Daily profile traffic and {isBookingReport ? 'booking' : 'order'} conversion insights.
        </p>
      </div>

      <div className="rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-1 text-sm text-[#4a4037]">
              <span className="font-semibold">Report date (Asia/Manila)</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="block min-w-[210px] rounded-lg border border-[#eadfce] px-3 py-2 text-sm focus:border-[#c98e5f] focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={refreshInsights}
              className="h-[42px] rounded-lg border border-[#eadfce] px-4 py-2 text-sm font-semibold text-[#6d645d] transition hover:bg-[#f7f3ed]"
            >
              Refresh Insights
            </button>
          </div>
          <div className="md:pb-2">
            {generatedLabel ? (
              <p className="text-xs text-[#8a8179] md:text-right">Generated: {generatedLabel}</p>
            ) : (
              <p className="text-xs text-[#b0a396] md:text-right">Generated timestamp will appear here.</p>
            )}
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-[#7a7168]">Loading traffic insights...</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-[#b42318]">{errorMessage}</p> : null}

        {summary ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Public Profile Views</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{summary.publicProfileViews || 0}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Completed {unitLabelPlural} (Today)</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{summary.completedOrdersToday || 0}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Conversion Rate</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{percent(summary.conversionRatePct)}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Total {unitLabelPlural} (Today)</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{summary.totalOrdersToday || 0}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Canceled {unitLabelPlural} (Today)</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{summary.canceledOrdersToday || 0}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Completion Rate</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{percent(summary.completionRatePct)}</p>
              </article>
            </div>

            <section className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#6b4a2f]">{unitLabelPlural} by Hour</h3>
                <p className="text-xs text-[#8a8179]">
                  Peak hour: {peakHour ? `${peakHour.hour} (${peakHour.orders} ${isBookingReport ? 'booking/s' : 'order/s'})` : `No ${unitLabelPlural.toLowerCase()}`}
                </p>
              </div>
              <div className="space-y-1">
                {ordersByHour.map((row) => (
                  <div key={row.hour} className="flex items-center gap-2">
                    <span className="w-12 text-xs text-[#8a8179]">{row.hour}</span>
                    <div className="h-2 flex-1 rounded-full bg-[#f1e8dc]">
                      <div
                        className="h-2 rounded-full bg-[#c98e5f]"
                        style={{ width: `${Math.max(2, (Number(row.orders || 0) / maxOrders) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-[#6d645d]">{row.orders || 0}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default TrafficInsights
