import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTouristOrdersStore } from '../store/tourist/tourist-orders.store.js'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../shared/utils/touristOrderDisplay.utils.js'

const POLL_MS = 5000

const getDateParts = (value) => {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return null
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate()
  }
}

const buildLocalDayKey = (value) => {
  const p = getDateParts(value)
  if (!p) return 'unknown-day'
  const mm = String(p.month + 1).padStart(2, '0')
  const dd = String(p.day).padStart(2, '0')
  return `${p.year}-${mm}-${dd}`
}

const buildLocalDayLabel = (value) => {
  const p = getDateParts(value)
  if (!p) return 'Unknown date'
  const now = new Date()
  const today = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const yesterday = {
    year: yesterdayDate.getFullYear(),
    month: yesterdayDate.getMonth(),
    day: yesterdayDate.getDate()
  }
  if (p.year === today.year && p.month === today.month && p.day === today.day) return 'Today'
  if (p.year === yesterday.year && p.month === yesterday.month && p.day === yesterday.day) return 'Yesterday'
  return new Date(p.year, p.month, p.day).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

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
        billingType: o.billingType || '',
        orderType: o.orderType || 'MENU_ORDER',
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
        statusLabel: touristCustomerOrderStatusLabel(o.status, o.orderType || 'MENU_ORDER'),
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
          : [],
        restaurantReview: o.restaurantReview || null
      })),
    [rawOrders]
  )

  const storeOrderGroups = useMemo(() => {
    const groups = new Map()
    for (const o of orders) {
      const dayKey = buildLocalDayKey(o.createdAt)
      const storeKey = o.businessId || `name:${o.businessName || 'unknown'}`
      const key = `${storeKey}|${dayKey}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          dayKey,
          dayLabel: buildLocalDayLabel(o.createdAt),
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
    errorMessage,
    refreshOrders
  }
}
