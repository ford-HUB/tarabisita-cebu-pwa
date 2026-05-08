import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAdminDashboardStore } from '../store/admin/dashboard.store'

const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toStatusKey = (value) => String(value || '').trim().toUpperCase()

const toCategoryKey = (value) => {
  const normalized = String(value || '').trim().toUpperCase()
  return normalized || 'UNCATEGORIZED'
}

const formatLabelFromKey = (key) =>
  String(key || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const buildLinePath = (values, width, height, maxValue) => {
  if (!Array.isArray(values) || values.length === 0) return ''
  const stepX = width / Math.max(values.length - 1, 1)
  return values
    .map((value, index) => {
      const x = index * stepX
      const y = height - (Number(value) / Math.max(maxValue, 1)) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export const useAdminDashboard = () => {
  const { snapshot, isLoading, lastUpdatedAt } = useAdminDashboardStore(
    useShallow((state) => ({
      snapshot: state.snapshot,
      isLoading: state.isLoading,
      lastUpdatedAt: state.lastUpdatedAt
    }))
  )

  const refresh = useCallback(async () => {
    await useAdminDashboardStore.getState().fetchSnapshot()
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const approvalStatusRows = useMemo(() => {
    const statusMap = snapshot.approvals.reduce((acc, approval) => {
      const key = toStatusKey(approval?.verificationStatus || approval?.status || 'PENDING')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusMap)
      .map(([key, count]) => ({
        key,
        label: formatLabelFromKey(key),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [snapshot.approvals])

  const categoryRows = useMemo(() => {
    const categoryMap = snapshot.partners.reduce((acc, partner) => {
      const key = toCategoryKey(partner?.category)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(categoryMap)
      .map(([key, count]) => ({
        key,
        label: formatLabelFromKey(key),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [snapshot.partners])

  const transactionTotals = useMemo(() => {
    const paidStatuses = new Set(['PAID', 'SUCCEEDED', 'SUCCESSFUL'])
    return snapshot.transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction?.amount) || 0
        const status = toStatusKey(transaction?.status)
        if (paidStatuses.has(status)) {
          acc.paidRevenue += amount
          acc.paidCount += 1
        } else {
          acc.pendingCount += 1
        }
        return acc
      },
      {
        paidRevenue: 0,
        paidCount: 0,
        pendingCount: 0
      }
    )
  }, [snapshot.transactions])

  const overviewCards = useMemo(
    () => [
      {
        label: 'Total users',
        value: snapshot.users.total,
        helper: `${snapshot.users.tourists} tourists, ${snapshot.users.businessOwners} business owners`
      },
      {
        label: 'Business partners',
        value: snapshot.partners.length,
        helper: 'Paid or previously subscribed businesses'
      },
      {
        label: 'Approval queue',
        value: snapshot.approvals.length,
        helper: 'Verification requests tracked'
      },
      {
        label: 'Paid transactions (30d)',
        value: transactionTotals.paidCount,
        helper: `${transactionTotals.pendingCount} pending or unpaid records`
      }
    ],
    [snapshot, transactionTotals]
  )

  const recentTransactions = useMemo(
    () =>
      [...snapshot.transactions]
        .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
        .slice(0, 5),
    [snapshot.transactions]
  )

  const revenueTrendRows = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 12 }, (_v, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: MONTH_SHORT_LABELS[d.getMonth()],
        revenue: 0
      }
    })

    const monthIndexByKey = months.reduce((acc, row, index) => {
      acc[row.key] = index
      return acc
    }, {})

    const paidStatuses = new Set(['PAID', 'SUCCEEDED', 'SUCCESSFUL'])
    snapshot.transactions.forEach((transaction) => {
      const status = toStatusKey(transaction?.status)
      if (!paidStatuses.has(status)) return

      const createdAt = new Date(transaction?.paidAt || transaction?.createdAt || 0)
      if (Number.isNaN(createdAt.getTime())) return
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      const targetIndex = monthIndexByKey[key]
      if (typeof targetIndex !== 'number') return
      months[targetIndex].revenue += Number(transaction?.amount) || 0
    })

    return months
  }, [snapshot.transactions])

  const revenueChartGeometry = useMemo(() => {
    const chartWidth = 900
    const chartHeight = 220
    const values = revenueTrendRows.map((row) => Number(row.revenue) || 0)
    const maxValue = Math.max(1, ...values)
    const activePath = buildLinePath(values, chartWidth, chartHeight, maxValue)
    const areaPath = activePath ? `${activePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : ''
    return { chartWidth, chartHeight, activePath, areaPath }
  }, [revenueTrendRows])

  const formatCurrency = useCallback(
    (amount) =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2
      }).format(Number(amount) || 0),
    []
  )

  const formatDate = useCallback((value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }, [])

  return {
    isLoading,
    lastUpdatedAt,
    refresh,
    overviewCards,
    userBreakdown: snapshot.users,
    approvalStatusRows,
    categoryRows,
    transactionTotals,
    recentTransactions,
    revenueTrendRows,
    revenueChartGeometry,
    formatCurrency,
    formatDate
  }
}
