import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from './useAuth.hook'
import { useCustomerOrdersStore } from '../store/business/customerOrders.store'

/**
 * Customer (menu) orders: service → store → this hook → pages/sections.
 * Loads list on mount; exposes list actions and derived `resolvedOrders` for Today's record.
 */
export const useCustomerOrders = () => {
  const { user } = useAuth()
  const normalizedCategory = String(user?.businessCategory || '').trim().toUpperCase()
  const isResortBusiness = normalizedCategory === 'RESORT' || normalizedCategory === 'HOTEL'
  const isCustomerOrdersSupported = normalizedCategory === 'RESTAURANT' || isResortBusiness

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
    if (!isCustomerOrdersSupported) return
    void loadOrders({ isResortBusiness })
  }, [isCustomerOrdersSupported, isResortBusiness, loadOrders])

  const resolvedOrders = useMemo(
    () => orders.filter((order) => order.status === 'FINISHED' || order.status === 'CANCELED'),
    [orders]
  )

  return {
    orders: isCustomerOrdersSupported ? orders : [],
    isLoading: isCustomerOrdersSupported ? isLoading : false,
    loadOrders,
    advanceOrderStatus,
    cancelOrder,
    resolvedOrders: isCustomerOrdersSupported ? resolvedOrders : [],
    isCustomerOrdersSupported
  }
}
