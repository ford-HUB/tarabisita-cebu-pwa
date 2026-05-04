import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCustomerOrdersStore } from '../store/business/customerOrders.store'

/**
 * Customer (menu) orders: service → store → this hook → pages/sections.
 * Loads list on mount; exposes list actions and derived `resolvedOrders` for Today's record.
 */
export const useCustomerOrders = () => {
  const { orders, isLoading, loadOrders, advanceOrderStatus, cancelOrder } = useCustomerOrdersStore(
    useShallow((s) => ({
      orders: s.orders,
      isLoading: s.isLoading,
      loadOrders: s.loadOrders,
      advanceOrderStatus: s.advanceOrderStatus,
      cancelOrder: s.cancelOrder
    }))
  )

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const resolvedOrders = useMemo(
    () => orders.filter((order) => order.status === 'FINISHED' || order.status === 'CANCELED'),
    [orders]
  )

  return {
    orders,
    isLoading,
    loadOrders,
    advanceOrderStatus,
    cancelOrder,
    resolvedOrders
  }
}
