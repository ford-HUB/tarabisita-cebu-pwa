import { useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiMaximize2, FiMinimize2, FiPackage } from 'react-icons/fi'
import CancelOrderModal from './order-board/CancelOrderModal'
import CollapsedOrderList from './order-board/CollapsedOrderList'
import ExpandedOrdersPanel from './order-board/ExpandedOrdersPanel'
import OrderDetailsModal from './order-board/OrderDetailsModal'
import ResolvedOrdersSection from './order-board/ResolvedOrdersSection'
import {
  ACTION_MENU_GAP,
  ACTION_MENU_HEIGHT,
  ACTION_MENU_WIDTH,
  AUTO_ROLL_SECONDS_PER_ITEM,
  defaultCancelReasons,
  sampleOrders,
  VIEWPORT_PADDING
} from './order-board/orderBoard.constants'

const orderColumns = [
  { key: 'PLACED', title: 'Order Placed', icon: FiPackage, countClassName: 'bg-[#fff0e3] text-[#9b5a2c]' },
  { key: 'PROCESSING', title: 'Being Processed', icon: FiClock, countClassName: 'bg-[#fff8dd] text-[#9c6a12]' },
  { key: 'FINISHED', title: 'Finished', icon: FiCheckCircle, countClassName: 'bg-[#e8f8ec] text-[#2a7b45]' }
]

const OrderBoardSection = () => {
  const [hoveredColumnKey, setHoveredColumnKey] = useState(null)
  const [ordersState, setOrdersState] = useState(sampleOrders)
  const ordersByColumn = useMemo(
    () =>
      orderColumns.reduce((accumulator, column) => {
        accumulator[column.key] = ordersState.filter((order) =>
          column.key === 'FINISHED'
            ? order.status === 'FINISHED' || order.status === 'CANCELED'
            : order.status === column.key
        )
        return accumulator
      }, {}),
    [ordersState]
  )
  const [expandedColumnKey, setExpandedColumnKey] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [itemFilter, setItemFilter] = useState('ALL')
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
  const [cancelTargetOrderId, setCancelTargetOrderId] = useState(null)
  const [cancelReason, setCancelReason] = useState(defaultCancelReasons[0])
  const [cancelNotes, setCancelNotes] = useState(defaultCancelReasons[0])

  const handleAdvanceOrderStatus = (orderId) => {
    setOrdersState((currentOrders) =>
      currentOrders.map((order) => {
        if (order.id !== orderId) return order
        if (order.status === 'PLACED') return { ...order, status: 'PROCESSING' }
        if (order.status === 'PROCESSING') return { ...order, status: 'FINISHED' }
        return order
      })
    )
    setOpenActionMenu(null)
  }

  const openCancelModal = (order) => {
    setCancelTargetOrderId(order.id)
    setCancelReason(defaultCancelReasons[0])
    setCancelNotes(defaultCancelReasons[0])
    setOpenActionMenu(null)
  }

  const closeCancelModal = () => {
    setCancelTargetOrderId(null)
    setCancelReason(defaultCancelReasons[0])
    setCancelNotes(defaultCancelReasons[0])
  }

  const handleCancelReasonChange = (value) => {
    setCancelReason(value)
    setCancelNotes(value)
  }

  const handleCancelOrder = () => {
    if (!cancelTargetOrderId) return
    const reasonText = cancelNotes.trim() || cancelReason
    setOrdersState((currentOrders) =>
      currentOrders.map((order) =>
        order.id === cancelTargetOrderId
          ? {
              ...order,
              status: 'CANCELED',
              cancelReason: reasonText
            }
          : order
      )
    )
    closeCancelModal()
  }

  const toggleActionMenu = (orderId, triggerElement) => {
    if (!triggerElement) return
    const rect = triggerElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = rect.right + ACTION_MENU_GAP
    if (left + ACTION_MENU_WIDTH > viewportWidth - VIEWPORT_PADDING) {
      left = rect.left - ACTION_MENU_WIDTH - ACTION_MENU_GAP
    }
    if (left < VIEWPORT_PADDING) {
      left = viewportWidth - ACTION_MENU_WIDTH - VIEWPORT_PADDING
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING
    }

    let top = rect.top + rect.height / 2 - ACTION_MENU_HEIGHT / 2
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING
    }
    if (top + ACTION_MENU_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - ACTION_MENU_HEIGHT - VIEWPORT_PADDING
    }

    setOpenActionMenu((current) =>
      current?.id === orderId
        ? null
        : {
            id: orderId,
            top,
            left
          }
    )
  }

  const visibleColumns = expandedColumnKey
    ? orderColumns.filter((column) => column.key === expandedColumnKey)
    : orderColumns
  const todaysResolvedOrders = useMemo(
    () => ordersState.filter((order) => order.status === 'FINISHED' || order.status === 'CANCELED'),
    [ordersState]
  )

  return (
    <section className="space-y-3 rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Restaurant Orders</p>
          <h3 className="mt-1 text-lg font-semibold text-[#2f2f2f]">Orders Flow</h3>
          <p className="text-sm text-[#6f665d]">Track newly placed orders, in-progress orders, and completed orders.</p>
        </div>
      </div>

      <div className={`grid gap-3 ${expandedColumnKey ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {visibleColumns.map((column) => {
          const Icon = column.icon
          const orders = ordersByColumn[column.key] || []
          const loopOrders = orders.length > 1 ? [...orders, ...orders, ...orders] : orders
          const isExpanded = expandedColumnKey === column.key
          const isHovered = hoveredColumnKey === column.key
          const filteredExpandedOrders = orders.filter((order) => {
            const query = searchQuery.trim().toLowerCase()
            const matchesQuery =
              !query ||
              String(order.id).toLowerCase().includes(query) ||
              String(order.customer).toLowerCase().includes(query)

            const matchesItemFilter =
              itemFilter === 'ALL' ||
              (itemFilter === 'LOW' && order.items <= 2) ||
              (itemFilter === 'HIGH' && order.items >= 3)

            return matchesQuery && matchesItemFilter
          })

          return (
            <article key={column.key} className="space-y-3 rounded-xl border border-[#ecdfd1] bg-[#fffdfb] p-3">
              <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-white p-1.5 text-[#7d5b3b] shadow-sm">
                    <Icon size={14} />
                  </span>
                  <h4 className="text-sm font-semibold text-[#2f2f2f]">{column.title}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${column.countClassName}`}>
                    {orders.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextExpandedKey = isExpanded ? null : column.key
                      setExpandedColumnKey(nextExpandedKey)
                      if (!nextExpandedKey) {
                        setSearchQuery('')
                        setItemFilter('ALL')
                      }
                      setOpenActionMenu(null)
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white p-1.5 text-[#7d5b3b] transition hover:bg-[#fff4e8]"
                    title={isExpanded ? 'Collapse list view' : 'Expand full-row list'}
                  >
                    {isExpanded ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
                  </button>
                </div>
              </header>

              {isExpanded ? (
                <ExpandedOrdersPanel
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  itemFilter={itemFilter}
                  setItemFilter={setItemFilter}
                  filteredOrders={filteredExpandedOrders}
                  openActionMenu={openActionMenu}
                  toggleActionMenu={toggleActionMenu}
                  onOpenDetails={setSelectedOrderDetails}
                  onAdvanceStatus={handleAdvanceOrderStatus}
                  onOpenCancelModal={openCancelModal}
                />
              ) : (
                <CollapsedOrderList
                  columnTitle={column.title}
                  columnKey={column.key}
                  orders={orders}
                  loopOrders={loopOrders}
                  isHovered={isHovered}
                  setHoveredColumnKey={setHoveredColumnKey}
                  autoRollSecondsPerItem={AUTO_ROLL_SECONDS_PER_ITEM}
                  onOpenDetails={setSelectedOrderDetails}
                  onAdvanceStatus={handleAdvanceOrderStatus}
                  onOpenCancelModal={openCancelModal}
                />
              )}
            </article>
          )
        })}
      </div>

      <ResolvedOrdersSection orders={todaysResolvedOrders} />

      {openActionMenu ? (
        <button
          type="button"
          aria-label="Close action menu"
          onClick={() => setOpenActionMenu(null)}
          className="fixed inset-0 z-20 cursor-default"
        />
      ) : null}

      <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
      <CancelOrderModal
        isOpen={Boolean(cancelTargetOrderId)}
        cancelReason={cancelReason}
        cancelNotes={cancelNotes}
        defaultCancelReasons={defaultCancelReasons}
        onReasonChange={handleCancelReasonChange}
        onNotesChange={setCancelNotes}
        onClose={closeCancelModal}
        onConfirm={handleCancelOrder}
      />
    </section>
  )
}

export default OrderBoardSection
