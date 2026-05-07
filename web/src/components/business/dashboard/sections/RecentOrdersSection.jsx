import { Link } from 'react-router-dom'
import { FiChevronRight, FiFilter } from 'react-icons/fi'

const STATUS_CLASSES = {
  Delivered: 'bg-[#e9fbef] text-[#1f8c4d]',
  Pending: 'bg-[#fff7e7] text-[#bc7b1f]',
  Canceled: 'bg-[#fff0ef] text-[#c44238]'
}

const RecentOrdersSection = ({
  recentOrders,
  orderStatusFilters,
  activeOrderFilter,
  setActiveOrderFilter,
  formatCurrency
}) => (
  <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm xl:col-span-2">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold text-[#1f1f1f]">Recent Orders</h2>
        <p className="text-sm text-[#7a7169]">Filter rows by latest order status</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f]">
          <FiFilter size={14} />
          {activeOrderFilter}
        </span>
        <Link
          to="/business/dashboard/orders"
          className="inline-flex items-center gap-1 rounded-xl border border-[#ece3d9] px-3 py-2 text-sm font-medium text-[#4f4f4f] hover:bg-[#faf7f3]"
        >
          See all
          <FiChevronRight size={14} />
        </Link>
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
            <th className="px-2 py-2 font-medium">Total</th>
            <th className="px-2 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-6 text-center text-xs text-[#8a8179]">
                No orders yet for the selected filter.
              </td>
            </tr>
          ) : (
            recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-[#f7f1e8] last:border-none">
                <td className="px-2 py-3">
                  <p className="font-medium text-[#2f2f2f]">{order.productName}</p>
                  <p className="text-xs text-[#8a8179]">
                    {order.orderCode ? `#${order.orderCode}` : order.dateLabel}
                  </p>
                </td>
                <td className="px-2 py-3 text-[#5f5650]">{order.category}</td>
                <td className="px-2 py-3 font-semibold text-[#3a342f]">{formatCurrency(order.amount)}</td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      STATUS_CLASSES[order.statusLabel] || STATUS_CLASSES.Pending
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </article>
)

export default RecentOrdersSection
