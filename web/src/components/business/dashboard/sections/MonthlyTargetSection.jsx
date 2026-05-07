const GAUGE_RADIUS = 74
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

const MonthlyTargetSection = ({ monthlyTarget, formatCurrency }) => {
  const achievedRate = Math.max(0, Math.min(100, Number(monthlyTarget.achievedRatePct) || 0))
  const progressLength = (achievedRate / 100) * GAUGE_CIRCUMFERENCE
  const monthlyEarnings = Number(monthlyTarget.monthlyEarnings) || 0
  const monthlyRevenue = Number(monthlyTarget.currentMonthRevenue) || 0
  const todayRevenue = Number(monthlyTarget.todayRevenue) || 0
  const goal = Number(monthlyTarget.goal) || 0

  return (
    <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-[#1f1f1f]">Monthly Target</h2>
      <p className="text-sm text-[#7a7169]">Progress towards this month&apos;s revenue goal</p>

      <div className="relative mt-4 flex h-56 items-center justify-center">
        <svg viewBox="0 0 180 180" className="h-52 w-52 -rotate-90">
          <circle cx="90" cy="90" r={GAUGE_RADIUS} fill="none" stroke="#f2e7db" strokeWidth="14" />
          <circle
            cx="90"
            cy="90"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="#9b5a2c"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${GAUGE_CIRCUMFERENCE - progressLength}`}
          />
        </svg>
        <div className="pointer-events-none absolute top-1/2 -translate-y-1 text-center">
          <p className="text-4xl font-bold text-[#1f1f1f]">{achievedRate.toFixed(2)}%</p>
          <span className="mt-3 inline-flex rounded-full bg-[#e9fbef] px-2.5 py-1 text-xs font-semibold text-[#1f8c4d]">
            of goal
          </span>
        </div>
      </div>

      <div className="mt-1 text-center">
        <p className="mt-3 text-[#5d554e]">
          You earn <span className="font-semibold">{formatCurrency(monthlyEarnings)}</span> this month.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 border-t border-[#f0e8de] pt-4 text-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Target</p>
          <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{formatCurrency(goal)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Revenue</p>
          <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{formatCurrency(monthlyRevenue)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Today</p>
          <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{formatCurrency(todayRevenue)}</p>
        </div>
      </div>
    </article>
  )
}

export default MonthlyTargetSection
