import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { defaultCancelReasons, ORDER_BOARD_COLUMNS } from '../components/business/menu/sections/order-board/orderBoard.constants'
import { getActionMenuPlacement } from '../components/business/menu/sections/order-board/orderBoard.utils'
import { useCustomerOrders } from './useCustomerOrders.hook'

/**
 * Local UI + derived column data for the restaurant orders Kanban (Profile-style: hook owns behavior, section composes UI).
 */
export const useOrderBoard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { orders, isLoading, advanceOrderStatus, cancelOrder } = useCustomerOrders()

  const ordersByColumn = useMemo(
    () =>
      ORDER_BOARD_COLUMNS.reduce((accumulator, column) => {
        accumulator[column.key] = orders.filter((order) =>
          column.key === 'FINISHED'
            ? order.status === 'FINISHED' || order.status === 'CANCELED'
            : order.status === column.key
        )
        return accumulator
      }, {}),
    [orders]
  )

  const [expandedColumnKey, setExpandedColumnKey] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [itemFilter, setItemFilter] = useState('ALL')
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
  const [customerNotesOrder, setCustomerNotesOrder] = useState(null)
  const [cancelTargetOrderId, setCancelTargetOrderId] = useState(null)
  const [cancelReason, setCancelReason] = useState(defaultCancelReasons[0])
  const [cancelNotes, setCancelNotes] = useState(defaultCancelReasons[0])

  useEffect(() => {
    const oid = searchParams.get('o')
    if (!oid || isLoading || !orders.length) return
    const found = orders.find((x) => String(x.id) === String(oid))
    if (!found) {
      const next = new URLSearchParams(searchParams)
      next.delete('o')
      setSearchParams(next, { replace: true })
      return
    }
    setSelectedOrderDetails(found)
    const next = new URLSearchParams(searchParams)
    next.delete('o')
    setSearchParams(next, { replace: true })
  }, [searchParams, orders, isLoading, setSearchParams])

  const handleAdvanceOrderStatus = useCallback(
    async (orderId) => {
      await advanceOrderStatus(orderId)
      setOpenActionMenu(null)
    },
    [advanceOrderStatus]
  )

  const openCancelModal = useCallback((order) => {
    setCancelTargetOrderId(order.id)
    setCancelReason(defaultCancelReasons[0])
    setCancelNotes(defaultCancelReasons[0])
    setOpenActionMenu(null)
  }, [])

  const closeCancelModal = useCallback(() => {
    setCancelTargetOrderId(null)
    setCancelReason(defaultCancelReasons[0])
    setCancelNotes(defaultCancelReasons[0])
  }, [])

  const handleCancelReasonChange = useCallback((value) => {
    setCancelReason(value)
    setCancelNotes(value)
  }, [])

  const handleCancelOrder = useCallback(async () => {
    if (!cancelTargetOrderId) return
    const reasonText = cancelNotes.trim() || cancelReason
    await cancelOrder(cancelTargetOrderId, reasonText)
    closeCancelModal()
  }, [cancelOrder, cancelNotes, cancelReason, cancelTargetOrderId, closeCancelModal])

  const toggleActionMenu = useCallback((orderId, triggerElement) => {
    const placement = getActionMenuPlacement(triggerElement)
    if (!placement) return
    setOpenActionMenu((current) =>
      current?.id === orderId
        ? null
        : {
            id: orderId,
            top: placement.top,
            left: placement.left
          }
    )
  }, [])

  const visibleColumns = useMemo(
    () =>
      expandedColumnKey
        ? ORDER_BOARD_COLUMNS.filter((column) => column.key === expandedColumnKey)
        : ORDER_BOARD_COLUMNS,
    [expandedColumnKey]
  )

  const openCustomerNotesModal = useCallback((order) => {
    setCustomerNotesOrder(order)
    setOpenActionMenu(null)
  }, [])

  const closeCustomerNotesModal = useCallback(() => {
    setCustomerNotesOrder(null)
  }, [])

  const toggleExpandedColumn = useCallback((columnKey, isCurrentlyExpanded) => {
    setOpenActionMenu(null)
    if (isCurrentlyExpanded) {
      setExpandedColumnKey(null)
      setSearchQuery('')
      setItemFilter('ALL')
    } else {
      setExpandedColumnKey(columnKey)
    }
  }, [])

  return {
    orders,
    isLoading,
    ordersByColumn,
    expandedColumnKey,
    visibleColumns,
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
  }
}
