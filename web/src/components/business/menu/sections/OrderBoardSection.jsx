import { FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import { useAuth } from '../../../../hooks/useAuth.hook'
import { useOrderBoard } from '../../../../hooks/useOrderBoard.hook'
import { getBusinessCategoryLabel } from '../../../../shared/constants/businessCategories.constants'
import CancelOrderModal from './order-board/CancelOrderModal'
import CollapsedOrderList from './order-board/CollapsedOrderList'
import ExpandedOrdersPanel from './order-board/ExpandedOrdersPanel'
import OrderBoardEmptyState from './order-board/OrderBoardEmptyState'
import OrderBoardHeader from './order-board/OrderBoardHeader'
import OrderDetailsModal from './order-board/OrderDetailsModal'
import TouristOrderNotesModal from './order-board/TouristOrderNotesModal'
import { defaultCancelReasons } from './order-board/orderBoard.constants'

const OrderBoardSection = () => {
  const { user } = useAuth()
  const isRestaurantAccount = getBusinessCategoryLabel(user?.businessCategory) === 'Restaurant'

  const {
    visibleColumns,
    orders,
    isLoading,
    ordersByColumn,
    expandedColumnKey,
    searchQuery,
    setSearchQuery,
    itemFilter,
    setItemFilter,
    openActionMenu,
    setOpenActionMenu,
    selectedOrderDetails,
    setSelectedOrderDetails,
    customerNotesOrder,
    openCustomerNotesModal,
    closeCustomerNotesModal,
    cancelTargetOrderId,
    cancelReason,
    cancelNotes,
    setCancelNotes,
    handleCancelReasonChange,
    closeCancelModal,
    handleAdvanceOrderStatus,
    openCancelModal,
    handleCancelOrder,
    toggleActionMenu,
    toggleExpandedColumn
  } = useOrderBoard()

  const isEmpty = orders.length === 0

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
      <OrderBoardHeader isLoading={isLoading} isEmpty={isEmpty} />

      {!isLoading && isEmpty ? (
        <OrderBoardEmptyState />
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col gap-3 ${expandedColumnKey ? '' : 'lg:flex-row'}`}>
          {visibleColumns.map((column) => {
            const Icon = column.icon
            const columnOrders = ordersByColumn[column.key] || []
            const isExpanded = expandedColumnKey === column.key
            const filteredExpandedOrders = columnOrders.filter((order) => {
              const query = searchQuery.trim().toLowerCase()
              const matchesQuery =
                !query ||
                String(order.id).toLowerCase().includes(query) ||
                String(order.orderCode || '').toLowerCase().includes(query) ||
                String(order.customer).toLowerCase().includes(query)

              const matchesItemFilter =
                itemFilter === 'ALL' ||
                (itemFilter === 'LOW' && order.items <= 2) ||
                (itemFilter === 'HIGH' && order.items >= 3)

              return matchesQuery && matchesItemFilter
            })

            return (
              <article
                key={column.key}
                className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 rounded-xl border border-[#ecdfd1] bg-[#fffdfb] p-3"
              >
                <header className="shrink-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-white p-1.5 text-[#7d5b3b] shadow-sm">
                      <Icon size={14} />
                    </span>
                    <h4 className="text-sm font-semibold text-[#2f2f2f]">{column.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${column.countClassName}`}>
                      {columnOrders.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpandedColumn(column.key, isExpanded)}
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
                    columnHasNoOrders={columnOrders.length === 0}
                    openActionMenu={openActionMenu}
                    toggleActionMenu={toggleActionMenu}
                    onOpenDetails={setSelectedOrderDetails}
                    isRestaurantAccount={isRestaurantAccount}
                    onOpenCustomerNotes={openCustomerNotesModal}
                    onAdvanceStatus={handleAdvanceOrderStatus}
                    onOpenCancelModal={openCancelModal}
                  />
                ) : (
                  <CollapsedOrderList
                    columnTitle={column.title}
                    orders={columnOrders}
                    onOpenDetails={setSelectedOrderDetails}
                    isRestaurantAccount={isRestaurantAccount}
                    onOpenCustomerNotes={openCustomerNotesModal}
                    onAdvanceStatus={handleAdvanceOrderStatus}
                    onOpenCancelModal={openCancelModal}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}

      {openActionMenu ? (
        <button
          type="button"
          aria-label="Close action menu"
          onClick={() => setOpenActionMenu(null)}
          className="fixed inset-0 z-20 cursor-default"
        />
      ) : null}

      <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
      <TouristOrderNotesModal order={customerNotesOrder} onClose={closeCustomerNotesModal} />
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
