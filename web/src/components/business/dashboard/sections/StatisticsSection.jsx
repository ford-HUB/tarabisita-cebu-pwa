import { FiCalendar } from 'react-icons/fi'

const StatisticsSection = ({
  overviewTabs,
  activeOverviewTab,
  setActiveOverviewTab,
  statisticsByMonth,
  chartGeometry,
  activeYear
}) => {
  const { chartWidth, chartHeight, activePath, salesPath, areaPath } = chartGeometry
  const showSecondaryLine = activeOverviewTab !== 'Sales' && Boolean(salesPath)

  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Statistics</h2>
          <p className="text-sm text-[#7a7169]">Monthly trend across orders, completed sales, and revenue</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[#ece3d9] bg-[#faf7f3] p-1">
            {overviewTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveOverviewTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeOverviewTab === tab
                    ? 'bg-white text-[#1f1f1f] shadow-sm'
                    : 'text-[#6d645d] hover:text-[#1f1f1f]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]">
            <FiCalendar size={14} />
            Jan - Dec {activeYear}
          </span>
        </div>
      </div>

      <div className="h-72 rounded-xl border border-[#efe4d7] bg-[#fcf8f2] p-4">
        <div className="h-full">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 26}`} className="h-full w-full">
            <defs>
              <linearGradient id="statsAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b5a2c" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#9b5a2c" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((tick) => {
              const y = (chartHeight / 4) * tick
              return (
                <line
                  key={tick}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#efe4d7"
                  strokeWidth="1"
                />
              )
            })}

            {areaPath ? <path d={areaPath} fill="url(#statsAreaFill)" /> : null}
            {activePath ? (
              <path d={activePath} fill="none" stroke="#9b5a2c" strokeWidth="3" strokeLinecap="round" />
            ) : null}
            {showSecondaryLine ? (
              <path d={salesPath} fill="none" stroke="#d5b9a0" strokeWidth="2.5" strokeLinecap="round" />
            ) : null}

            {statisticsByMonth.map((row, index) => {
              const x = (chartWidth / Math.max(statisticsByMonth.length - 1, 1)) * index
              return (
                <text
                  key={row.month}
                  x={x}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8b8480"
                >
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

export default StatisticsSection
