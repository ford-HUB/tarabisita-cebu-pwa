import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTouristOrdersStore } from '../store/tourist/tourist-orders.store.js'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../shared/utils/touristOrderDisplay.utils.js'

const POLL_MS = 5000

/**
 * Loads the tourist’s menu order history and refreshes on an interval so kitchen status
 * (e.g. PLACED → PROCESSING) stays in sync with the business order board.
 */
export const useTouristOrders = () => {
  const { rawOrders, isLoading, errorMessage, loadOrders, refreshOrders } = useTouristOrdersStore(
    useShallow((s) => ({
      rawOrders: s.orders,
      isLoading: s.isLoading,
      errorMessage: s.errorMessage,
      loadOrders: s.loadOrders,
      refreshOrders: s.refreshOrders
    }))
  )

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const id = setInterval(() => {
      void refreshOrders()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [refreshOrders])

  useEffect(() => {
    const onFocus = () => void refreshOrders()
    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshOrders()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshOrders])

  const orders = useMemo(
    () =>
      rawOrders.map((o) => ({
        id: o.id,
        title: o.productName || 'Order',
        orderCode: o.orderCode || '',
        businessId: o.businessId || '',
        businessName: o.businessName || '',
        customerName: o.customer || '',
        businessPhone: o.businessPhone || '',
        businessEmail: o.businessEmail || '',
        businessWebsite: o.businessWebsite || '',
        businessWhatsapp: o.businessWhatsapp || '',
        businessStoreImage: o.businessStoreImage || '',
        subtitleParts: [o.orderCode].filter(Boolean),
        detailPreview: (o.productDetails || '').split('\n').slice(0, 4).join('\n').trim(),
        productImage: o.productImage || '',
        itemsCount: o.items,
        total: o.total,
        time: o.time,
        statusKey: o.status,
        statusLabel: touristCustomerOrderStatusLabel(o.status),
        statusBadgeClass: touristCustomerOrderStatusBadgeClass(o.status),
        cancelReason: o.cancelReason || '',
        createdAt: o.createdAt,
        lineItems: Array.isArray(o.lineItems)
          ? o.lineItems
              .map((li) => ({
                menuItemId: String(li.menuItemId || ''),
                name: String(li.name || 'Item'),
                qty: Math.min(99, Math.max(1, Number(li.qty) || 1)),
                unit: Number.isFinite(Number(li.unit)) ? Number(li.unit) : 0,
                lineNotes: String(li.lineNotes || ''),
                image: String(li.image || '')
              }))
              .filter((li) => li.menuItemId)
          : []
      })),
    [rawOrders]
  )

  const storeOrderGroups = useMemo(() => {
    const groups = new Map()
    for (const o of orders) {
      const key = o.businessId || `name:${o.businessName || 'unknown'}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          businessId: o.businessId,
          businessName: o.businessName || 'Store',
          businessStoreImage: o.businessStoreImage || '',
          orders: []
        })
      }
      groups.get(key).orders.push(o)
    }
    const list = [...groups.values()]
    const newestTs = (g) =>
      Math.max(
        0,
        ...g.orders.map((ord) => {
          const t = ord.createdAt ? new Date(ord.createdAt).getTime() : 0
          return Number.isFinite(t) ? t : 0
        })
      )
    list.sort((a, b) => newestTs(b) - newestTs(a))
    return list
  }, [orders])

  return {
    orders,
    storeOrderGroups,
    isLoading,
    errorMessage
  }
}
