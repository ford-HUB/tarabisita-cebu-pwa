import { useMemo, useState } from 'react'
import { FiCalendar, FiChevronDown, FiFilter, FiShoppingBag, FiTrendingDown, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth.hook'

const monthlySalesData = [
  { month: 'Jan', sales: 140, revenue: 7000 },
  { month: 'Feb', sales: 330, revenue: 17200 },
  { month: 'Mar', sales: 190, revenue: 9800 },
  { month: 'Apr', sales: 260, revenue: 13500 },
  { month: 'May', sales: 160, revenue: 8200 },
  { month: 'Jun', sales: 170, revenue: 8900 },
  { month: 'Jul', sales: 250, revenue: 12400 },
  { month: 'Aug', sales: 90, revenue: 5000 },
  { month: 'Sep', sales: 180, revenue: 9500 },
  { month: 'Oct', sales: 340, revenue: 17600 },
  { month: 'Nov', sales: 240, revenue: 12100 },
  { month: 'Dec', sales: 80, revenue: 4300 }
]

const productIncreaseData = [
  { month: 'Jan', overview: 150, sales: 115, revenue: 35 },
  { month: 'Feb', overview: 162, sales: 109, revenue: 53 },
  { month: 'Mar', overview: 141, sales: 97, revenue: 44 },
  { month: 'Apr', overview: 132, sales: 88, revenue: 44 },
  { month: 'May', overview: 148, sales: 92, revenue: 56 },
  { month: 'Jun', overview: 139, sales: 86, revenue: 53 },
  { month: 'Jul', overview: 141, sales: 96, revenue: 45 },
  { month: 'Aug', overview: 170, sales: 111, revenue: 59 },
  { month: 'Sep', overview: 188, sales: 120, revenue: 68 },
  { month: 'Oct', overview: 176, sales: 125, revenue: 51 },
  { month: 'Nov', overview: 198, sales: 140, revenue: 58 },
  { month: 'Dec', overview: 194, sales: 132, revenue: 62 }
]

const recentOrders = [
  { id: '#ORD-101', product: 'Beef Kare-Kare', category: 'Main Course', price: 320, status: 'Delivered', quantity: 2 },
  { id: '#ORD-102', product: 'Pork Sisig', category: 'Main Course', price: 220, status: 'Pending', quantity: 1 },
  { id: '#ORD-103', product: 'Chicken Inasal', category: 'Grilled', price: 189, status: 'Delivered', quantity: 3 },
  { id: '#ORD-104', product: 'Halo-Halo', category: 'Dessert', price: 159, status: 'Canceled', quantity: 1 },
  { id: '#ORD-105', product: 'Sinigang na Hipon', category: 'Soup', price: 240, status: 'Delivered', quantity: 2 },
  { id: '#ORD-106', product: 'Pancit Canton', category: 'Noodles', price: 175, status: 'Pending', quantity: 1 }
]

const topProducts = [
  { name: 'Pork Sisig', sold: 89, revenue: 19580 },
  { name: 'Chicken Inasal', sold: 74, revenue: 13986 },
  { name: 'Bulalo', sold: 52, revenue: 14560 },
  { name: 'Lechon Kawali', sold: 47, revenue: 10810 },
  { name: 'Halo-Halo', sold: 39, revenue: 6201 }
]

const overviewTabs = ['Overview', 'Sales', 'Revenue']
const orderStatusFilters = ['All', 'Delivered', 'Pending', 'Canceled']
const strokeByTab = {
  Overview: '#9b5a2c',
  Sales: '#c27235',
  Revenue: '#7a4a2a'
}

const toCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount)

const toLinePath = (values, width, height, maxValue) => {
  if (!values.length) return ''
  const stepX = width / Math.max(values.length - 1, 1)

  return values
    .map((value, index) => {
      const x = index * stepX
      const y = height - (value / maxValue) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

const Home = () => {
  const { user } = useAuth()
  const [activeOverviewTab, setActiveOverviewTab] = useState('Overview')
  const [activeOrderFilter, setActiveOrderFilter] = useState('All')
  const isRestaurant = String(user?.businessCategory || '').toUpperCase() === 'RESTAURANT'

  const totalOrders = recentOrders.length
  const deliveredOrders = recentOrders.filter((order) => order.status === 'Delivered').length
  const pendingOrders = recentOrders.filter((order) => order.status === 'Pending').length
  const canceledOrders = recentOrders.filter((order) => order.status === 'Canceled').length
  const weeklyRevenue = recentOrders.reduce((sum, order) => sum + order.price * order.quantity, 0)
  const monthlyRevenue = monthlySalesData.reduce((sum, item) => sum + item.revenue, 0)
  const monthlyEarnings = monthlyRevenue * 0.31
  const monthlyTargetRate = 75.55
  const monthlyTargetGoal = 20000

  const filteredOrders = useMemo(() => {
    if (activeOrderFilter === 'All') return recentOrders
    return recentOrders.filter((order) => order.status === activeOrderFilter)
  }, [activeOrderFilter])

  const activeLineKey = activeOverviewTab.toLowerCase()
  const topProductsChartData = topProducts.map((item) => ({
    name: item.name,
    sold: item.sold
  }))
  const maxMonthlySales = Math.max(...monthlySalesData.map((item) => item.sales), 1)
  const maxProductSeriesValue = Math.max(...productIncreaseData.map((item) => item[activeLineKey] || 0), 1)
  const maxTopProductSold = Math.max(...topProductsChartData.map((item) => item.sold), 1)
  const statsOverviewValues = productIncreaseData.map((item) => item.overview)
  const statsSalesValues = productIncreaseData.map((item) => item.sales)
  const chartWidth = 900
  const chartHeight = 220
  const overviewPath = toLinePath(statsOverviewValues, chartWidth, chartHeight, maxProductSeriesValue)
  const salesPath = toLinePath(statsSalesValues, chartWidth, chartHeight, maxProductSeriesValue)
  const areaPath = `${overviewPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
  const normalizedTargetRate = Math.max(Math.min(monthlyTargetRate, 100), 0)
  const gaugeRadius = 74
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeProgressLength = (normalizedTargetRate / 100) * gaugeCircumference

  if (!isRestaurant) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-[#1f1f1f]">Welcome, {user?.name || 'Business owner'}</h1>
          <p className="mt-2 text-sm text-[#4f4f4f]">
            Your dashboard is ready. Submit your business proof to complete account verification and unlock full access.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
              <div className="inline-flex rounded-xl bg-[#fff2e6] p-2 text-[#9b5a2c]">
                <FiUsers size={18} />
              </div>
              <p className="mt-4 text-sm text-[#6f665d]">Customers</p>
              <p className="mt-1 text-3xl font-bold text-[#202020]">3,782</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e9fbef] px-2.5 py-1 text-xs font-semibold text-[#1f8c4d]">
                <FiTrendingUp size={12} />
                11.01%
              </span>
            </article>

            <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
              <div className="inline-flex rounded-xl bg-[#fff2e6] p-2 text-[#9b5a2c]">
                <FiShoppingBag size={18} />
              </div>
              <p className="mt-4 text-sm text-[#6f665d]">Orders</p>
              <p className="mt-1 text-3xl font-bold text-[#202020]">{totalOrders.toLocaleString()}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#fff0ef] px-2.5 py-1 text-xs font-semibold text-[#c44238]">
                <FiTrendingDown size={12} />
                9.05%
              </span>
            </article>
          </div>

          <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1f1f1f]">Monthly Sales</h2>
                <p className="text-sm text-[#7a7169]">Menu and product sales this year</p>
              </div>
            </div>
            <div className="h-60">
              <div className="flex h-full items-end gap-2 rounded-xl border border-[#efe4d7] bg-[#fcf8f2] p-4">
                {monthlySalesData.map((item) => {
                  const height = Math.max((item.sales / maxMonthlySales) * 100, 6)
                  return (
                    <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <div className="w-full rounded-t-lg bg-[#9b5a2c]" style={{ height: `${height}%` }} title={`${item.month}: ${item.sales}`} />
                      <span className="text-[10px] text-[#8d847d]">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#1f1f1f]">Monthly Target</h2>
          <p className="text-sm text-[#7a7169]">Target you&apos;ve set for each month</p>

          <div className="relative mt-4 flex h-56 items-center justify-center">
            <svg viewBox="0 0 180 180" className="h-52 w-52 -rotate-90">
              <circle cx="90" cy="90" r={gaugeRadius} fill="none" stroke="#f2e7db" strokeWidth="14" />
              <circle
                cx="90"
                cy="90"
                r={gaugeRadius}
                fill="none"
                stroke="#9b5a2c"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${gaugeProgressLength} ${gaugeCircumference - gaugeProgressLength}`}
              />
            </svg>
            <div className="pointer-events-none absolute top-1/2 -translate-y-1 text-center">
              <p className="text-4xl font-bold text-[#1f1f1f]">{monthlyTargetRate.toFixed(2)}%</p>
              <span className="mt-3 inline-flex rounded-full bg-[#e9fbef] px-2.5 py-1 text-xs font-semibold text-[#1f8c4d]">+10%</span>
            </div>
          </div>

          <div className="mt-1 text-center">
            <p className="mt-3 text-[#5d554e]">
              You earn <span className="font-semibold">{toCurrency(monthlyEarnings)}</span> this month.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 border-t border-[#f0e8de] pt-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8f867e]">Target</p>
              <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{toCurrency(monthlyTargetGoal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8f867e]">Revenue</p>
              <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{toCurrency(monthlyRevenue)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8f867e]">Today</p>
              <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">{toCurrency(weeklyRevenue)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#1f1f1f]">Statistics</h2>
            <p className="text-sm text-[#7a7169]">Target you&apos;ve set for each month</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[#ece3d9] bg-[#faf7f3] p-1">
              {overviewTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveOverviewTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    activeOverviewTab === tab ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6d645d] hover:text-[#1f1f1f]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]"
            >
              <FiCalendar size={14} />
              Apr 26 - May 2
            </button>
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
                return <line key={tick} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#efe4d7" strokeWidth="1" />
              })}

              <path d={areaPath} fill="url(#statsAreaFill)" />
              <path d={overviewPath} fill="none" stroke="#9b5a2c" strokeWidth="3" strokeLinecap="round" />
              <path d={salesPath} fill="none" stroke="#d5b9a0" strokeWidth="2.5" strokeLinecap="round" />

              {productIncreaseData.map((item, index) => {
                const x = (chartWidth / (productIncreaseData.length - 1)) * index
                return (
                  <text key={item.month} x={x} y={chartHeight + 18} textAnchor="middle" fontSize="11" fill="#8b8480">
                    {item.month}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-[#1f1f1f]">Recent Orders</h2>
              <p className="text-sm text-[#7a7169]">Filter rows by latest order status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]"
              >
                <FiFilter size={14} />
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]"
              >
                See all
                <FiChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {orderStatusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveOrderFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeOrderFilter === status
                    ? 'bg-[#9b5a2c] text-white'
                    : 'border border-[#ece3d9] bg-white text-[#6f665d] hover:bg-[#f8f5f1]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#f0e8de] text-[#8a8179]">
                  <th className="px-2 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Price</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#f7f1e8] last:border-none">
                    <td className="px-2 py-3">
                      <p className="font-medium text-[#2f2f2f]">{order.product}</p>
                      <p className="text-xs text-[#8a8179]">{order.id}</p>
                    </td>
                    <td className="px-2 py-3 text-[#5f5650]">{order.category}</td>
                    <td className="px-2 py-3 font-semibold text-[#3a342f]">{toCurrency(order.price)}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          order.status === 'Delivered'
                            ? 'bg-[#e9fbef] text-[#1f8c4d]'
                            : order.status === 'Pending'
                              ? 'bg-[#fff7e7] text-[#bc7b1f]'
                              : 'bg-[#fff0ef] text-[#c44238]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Top Products This Week</h2>
          <p className="text-sm text-[#7a7169]">Best menu items by quantity sold</p>

          <div className="mt-4 h-60">
            <div className="space-y-3">
              {topProductsChartData.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#6d645d]">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="font-medium text-[#1f1f1f]">{item.sold}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f2e7db]">
                    <div
                      className="h-full rounded-full bg-[#9b5a2c]"
                      style={{ width: `${Math.max((item.sold / maxTopProductSold) * 100, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-[#f0e8de] pt-4">
            {topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between text-xs text-[#7a7169]">
                <span>{product.name}</span>
                <span className="font-medium text-[#4f4f4f]">{toCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-[#ece3d9] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Delivered Orders</p>
          <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{deliveredOrders}</p>
        </article>
        <article className="rounded-xl border border-[#ece3d9] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Pending Orders</p>
          <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{pendingOrders}</p>
        </article>
        <article className="rounded-xl border border-[#ece3d9] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#8f867e]">Canceled Orders</p>
          <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{canceledOrders}</p>
        </article>
      </section>
    </div>
  )
}

export default Home