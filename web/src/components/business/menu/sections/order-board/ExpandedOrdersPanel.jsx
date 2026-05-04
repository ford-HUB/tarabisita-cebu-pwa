import { FiMoreVertical, FiSearch } from 'react-icons/fi'
import { orderHasCustomerNotes } from './orderBoardCustomerNotes.utils'

const ExpandedOrdersPanel = ({
  searchQuery,
  setSearchQuery,
  itemFilter,
  setItemFilter,
  filteredOrders,
  columnHasNoOrders = false,
  openActionMenu,
  toggleActionMenu,
  onOpenDetails,
  isRestaurantAccount = false,
  onOpenCustomerNotes,
  onAdvanceStatus,
  onOpenCancelModal
}) => {
  const noActiveFilters = !String(searchQuery || '').trim() && itemFilter === 'ALL'
  const emptyListMessage =
    columnHasNoOrders && noActiveFilters ? 'No orders yet' : 'No matching orders found.'
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#ecdfd1] bg-white">
      <div className="shrink-0 grid gap-2 border-b border-[#f0e4d7] bg-[#fffdf8] p-3 md:grid-cols-2">
        <label className="relative">
          <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9a8b7c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search order ID or customer"
            className="w-full rounded-lg border border-[#eadfce] bg-white py-2 pr-3 pl-9 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          />
        </label>
        <select
          value={itemFilter}
          onChange={(event) => setItemFilter(event.target.value)}
          className="rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
        >
          <option value="ALL">All Item Counts</option>
          <option value="LOW">1-2 Items</option>
          <option value="HIGH">3+ Items</option>
        </select>
      </div>

      <div className="shrink-0 grid grid-cols-[1fr_1.6fr_1.2fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-[#f0e4d7] bg-[#fff7ee] px-3 py-2 text-xs font-semibold text-[#7d5b3b]">
        <span>Order ID</span>
        <span>Product</span>
        <span>Customer</span>
        <span>Items</span>
        <span>Total</span>
        <span>Time</span>
        <span>Action</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-[#f2e8dc]">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_1.6fr_1.2fr_0.8fr_0.9fr_0.9fr_0.9fr] items-center gap-2 px-3 py-2 text-xs text-[#4f4f4f] md:text-sm"
            >
              <span className="font-semibold text-[#7d5b3b]">{order.orderCode || order.id}</span>
              <span className="flex min-w-0 items-center gap-2">
                <img src={order.productImage} alt={order.productName} className="h-9 w-9 shrink-0 rounded-md object-cover" />
                <span className="min-w-0">
                  <p className="truncate font-medium text-[#2f2f2f]">{order.productName}</p>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(order)}
                      className="text-[11px] text-[#9b5a2c] hover:underline"
                    >
                      View details
                    </button>
                    {isRestaurantAccount && orderHasCustomerNotes(order) ? (
                      <button
                        type="button"
                        onClick={() => onOpenCustomerNotes?.(order)}
                        className="text-[11px] font-semibold text-[#7d5b3b] hover:underline"
                      >
                        Customer notes
                      </button>
                    ) : null}
                  </span>
                </span>
              </span>
              <span className="font-medium text-[#2f2f2f]">{order.customer}</span>
              <span>{order.items} item(s)</span>
              <span className="font-semibold text-[#9b5a2c]">{order.total}</span>
              <span className="text-[#8a7f74]">{order.time}</span>
              <span>
                <button
                  type="button"
                  onClick={(event) => toggleActionMenu(order.id, event.currentTarget)}
                  className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white p-1.5 text-[#7d5b3b] transition hover:bg-[#fff4e8]"
                >
                  <FiMoreVertical size={13} />
                </button>
                {openActionMenu?.id === order.id ? (
                  <div
                    className="fixed z-30 w-44 rounded-lg border border-[#ecdfd1] bg-white p-1 shadow-lg"
                    style={{
                      top: `${openActionMenu.top}px`,
                      left: `${openActionMenu.left}px`
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenDetails(order)}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-[#3f3f3f] hover:bg-[#f8f2e9]"
                    >
                      View product details
                    </button>
                    {isRestaurantAccount && orderHasCustomerNotes(order) ? (
                      <button
                        type="button"
                        onClick={() => onOpenCustomerNotes?.(order)}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-[#7d5b3b] hover:bg-[#f8f2e9]"
                      >
                        Customer notes
                      </button>
                    ) : null}
                    {order.status === 'PLACED' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onAdvanceStatus(order.id)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-[#9b5a2c] hover:bg-[#fff0e3]"
                        >
                          Mark as Processing
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCancelModal(order)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-[#b54747] hover:bg-[#fff0f0]"
                        >
                          Cancel Order
                        </button>
                      </>
                    ) : order.status === 'PROCESSING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onAdvanceStatus(order.id)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-[#9c6a12] hover:bg-[#fff8dd]"
                        >
                          Mark as Finished
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCancelModal(order)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-[#b54747] hover:bg-[#fff0f0]"
                        >
                          Cancel Order
                        </button>
                      </>
                    ) : order.status === 'CANCELED' ? (
                      <p className="px-2 py-1.5 text-xs font-semibold text-[#b54747]">Canceled</p>
                    ) : (
                      <p className="px-2 py-1.5 text-xs font-semibold text-[#2a7b45]">Completed</p>
                    )}
                  </div>
                ) : null}
              </span>
            </div>
          ))}
          {filteredOrders.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-[#8f8377]">{emptyListMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ExpandedOrdersPanel
