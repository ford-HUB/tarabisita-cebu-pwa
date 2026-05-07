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
        accumulator[column.key] = orders.filter((order) => order.status === column.key)
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
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(tick)
  }, [])

  const getFinishedOrderRemainingMs = useCallback(
    (order) => {
      if (order.status !== 'FINISHED') return null
      const sourceTime = order.updatedAt || order.createdAt
      const startedAtMs = new Date(sourceTime).getTime()
      if (!Number.isFinite(startedAtMs)) return null
      const remainingMs = startedAtMs + 5 * 60 * 1000 - nowMs
      return remainingMs
    },
    [nowMs]
  )

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

  const getFinishedCountdownLabel = useCallback(
    (order) => {
      const remainingMs = getFinishedOrderRemainingMs(order)
      if (remainingMs == null) return '--:--'
      const clampedSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
      const minutes = Math.floor(clampedSeconds / 60)
      const seconds = clampedSeconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },
    [getFinishedOrderRemainingMs]
  )

  const activeOrdersByColumn = useMemo(
    () =>
      ORDER_BOARD_COLUMNS.reduce((accumulator, column) => {
        const sourceOrders = ordersByColumn[column.key] || []
        accumulator[column.key] = sourceOrders.filter((order) => {
          if (order.status !== 'FINISHED') return true
          const remainingMs = getFinishedOrderRemainingMs(order)
          return remainingMs == null || remainingMs > 0
        })
        return accumulator
      }, {}),
    [ordersByColumn, getFinishedOrderRemainingMs]
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
    ordersByColumn: activeOrdersByColumn,
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
    toggleExpandedColumn,
    getFinishedCountdownLabel
  }
}
