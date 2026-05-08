const AdminDashboardCategoryBreakdownSection = ({ rows }) => {
  const maxCount = Math.max(...rows.map((row) => row.count), 1)

  return (
    <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1f1f1f]">Business categories</h2>
      <p className="mt-1 text-sm text-[#7a7169]">Top partner categories based on current records.</p>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#ece3d9] bg-[#fcfaf7] px-3 py-4 text-sm text-[#7a7169]">
            No category data available.
          </p>
        ) : (
          rows.map((row) => {
            const widthPct = Math.max((row.count / maxCount) * 100, 10)
            return (
              <div key={row.key}>
                <div className="mb-1 flex items-center justify-between text-xs text-[#615950]">
                  <span>{row.label}</span>
                  <span>{row.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-[#f4ede3]">
                  <div className="h-full rounded-full bg-[#9b5a2c]" style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </article>
  )
}

export default AdminDashboardCategoryBreakdownSection
