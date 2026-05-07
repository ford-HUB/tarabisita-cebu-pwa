import { FiShoppingBag, FiTrendingDown, FiTrendingUp, FiUsers } from 'react-icons/fi'

const formatTrendValue = (value) => {
  const numeric = Number(value) || 0
  return `${Math.abs(numeric).toFixed(2)}%`
}

const TrendBadge = ({ deltaPct }) => {
  const isPositive = (Number(deltaPct) || 0) >= 0
  const Icon = isPositive ? FiTrendingUp : FiTrendingDown
  const className = isPositive
    ? 'bg-[#e9fbef] text-[#1f8c4d]'
    : 'bg-[#fff0ef] text-[#c44238]'
  return (
    <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon size={12} />
      {formatTrendValue(deltaPct)}
    </span>
  )
}

const KpiCardsSection = ({ totals }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-xl bg-[#fff2e6] p-2 text-[#9b5a2c]">
        <FiUsers size={18} />
      </div>
      <p className="mt-4 text-sm text-[#6f665d]">Customers</p>
      <p className="mt-1 text-3xl font-bold text-[#202020]">{totals.customers.toLocaleString()}</p>
      <TrendBadge deltaPct={totals.customersDeltaPct} />
    </article>

    <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-xl bg-[#fff2e6] p-2 text-[#9b5a2c]">
        <FiShoppingBag size={18} />
      </div>
      <p className="mt-4 text-sm text-[#6f665d]">Orders</p>
      <p className="mt-1 text-3xl font-bold text-[#202020]">{totals.orders.toLocaleString()}</p>
      <TrendBadge deltaPct={totals.ordersDeltaPct} />
    </article>
  </div>
)

export default KpiCardsSection
