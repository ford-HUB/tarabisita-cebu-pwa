const MonthlySalesSection = ({ monthlySales, maxMonthlySales }) => {
  const hasData = monthlySales.some((row) => Number(row.sales) > 0)

  return (
    <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Monthly Sales</h2>
          <p className="text-sm text-[#7a7169]">Items sold per month from completed orders</p>
        </div>
      </div>
      <div className="relative h-60">
        <div className="flex h-full items-end gap-2 rounded-xl border border-[#efe4d7] bg-[#fcf8f2] p-4">
          {monthlySales.map((row) => {
            const heightPct = Math.max(((Number(row.sales) || 0) / Math.max(maxMonthlySales, 1)) * 100, 6)
            return (
              <div
                key={row.month}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full rounded-t-lg bg-[#9b5a2c]"
                  style={{ height: `${heightPct}%` }}
                  title={`${row.month}: ${row.sales}`}
                />
                <span className="text-[10px] text-[#8d847d]">{row.month}</span>
              </div>
            )
          })}
        </div>
        {!hasData && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-[#8d847d]">
            No completed orders yet for this year.
          </p>
        )}
      </div>
    </article>
  )
}

export default MonthlySalesSection
