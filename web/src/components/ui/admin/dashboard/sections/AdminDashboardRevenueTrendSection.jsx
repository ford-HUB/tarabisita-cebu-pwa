import { FiCalendar } from 'react-icons/fi'

const AdminDashboardRevenueTrendSection = ({ chartGeometry, trendRows }) => {
  const { chartWidth, chartHeight, activePath, areaPath } = chartGeometry

  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Revenue trend</h2>
          <p className="text-sm text-[#7a7169]">Monthly paid subscription revenue across the last 12 months</p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]">
          <FiCalendar size={14} />
          Last 12 months
        </span>
      </div>

      <div className="h-72 rounded-xl border border-[#efe4d7] bg-[#fcf8f2] p-4">
        <div className="h-full">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 26}`} className="h-full w-full">
            <defs>
              <linearGradient id="adminRevenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b5a2c" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#9b5a2c" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((tick) => {
              const y = (chartHeight / 4) * tick
              return (
                <line key={tick} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#efe4d7" strokeWidth="1" />
              )
            })}

            {areaPath ? <path d={areaPath} fill="url(#adminRevenueAreaFill)" /> : null}
            {activePath ? (
              <path d={activePath} fill="none" stroke="#9b5a2c" strokeWidth="3" strokeLinecap="round" />
            ) : null}

            {trendRows.map((row, index) => {
              const x = (chartWidth / Math.max(trendRows.length - 1, 1)) * index
              return (
                <text key={row.key} x={x} y={chartHeight + 18} textAnchor="middle" fontSize="11" fill="#8b8480">
                  {row.month}
                </text>
              )
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}

export default AdminDashboardRevenueTrendSection
