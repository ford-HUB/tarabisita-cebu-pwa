import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBusinessDashboardStore } from '../store/business/dashboard.store'

const ORDER_STATUS_FILTERS = ['All', 'Delivered', 'Pending', 'Canceled']
const RESORT_BOOKING_STATUS_FILTERS = ['All', 'Confirmed', 'Waiting for approval', 'Waiting for payment', 'Cancelled']
const OVERVIEW_TABS = ['Overview', 'Sales', 'Revenue']

const resolveCurrentManilaYear = () => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  return Number(today.slice(0, 4))
}

const toCurrencyPhp = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

const mapStatusToLabel = (status, isResortDashboard) => {
  if (isResortDashboard) {
    if (status === 'FINISHED') return 'Confirmed'
    if (status === 'PROCESSING') return 'Waiting for payment'
    if (status === 'CANCELED') return 'Cancelled'
    return 'Waiting for approval'
  }
  if (status === 'FINISHED') return 'Delivered'
  if (status === 'CANCELED') return 'Canceled'
  return 'Pending'
}

const formatRecentOrderDateLabel = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

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

const STATISTICS_KEY_BY_TAB = {
  Overview: 'overview',
  Sales: 'sales',
  Revenue: 'revenue'
}

export const useBusinessDashboard = ({ isResortDashboard = false } = {}) => {
  const { data, isLoading, errorMessage, selectedYear, loadDashboard, setSelectedYear } = useBusinessDashboardStore(
    useShallow((state) => ({
      data: state.data,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      selectedYear: state.selectedYear,
      loadDashboard: state.loadDashboard,
      setSelectedYear: state.setSelectedYear
    }))
  )

  const [activeOverviewTab, setActiveOverviewTab] = useState('Overview')
  const [activeOrderFilter, setActiveOrderFilter] = useState('All')
  const orderStatusFilters = isResortDashboard ? RESORT_BOOKING_STATUS_FILTERS : ORDER_STATUS_FILTERS

  const activeYear = selectedYear || resolveCurrentManilaYear()

  useEffect(() => {
    void loadDashboard({ year: activeYear })
  }, [activeYear, loadDashboard])

  useEffect(() => {
    if (!orderStatusFilters.includes(activeOrderFilter)) {
      setActiveOrderFilter('All')
    }
  }, [activeOrderFilter, orderStatusFilters])

  const handleSelectYear = useCallback(
    (year) => {
      setSelectedYear(year)
    },
    [setSelectedYear]
  )

  const refresh = useCallback(() => {
    void loadDashboard({ year: activeYear })
  }, [activeYear, loadDashboard])

  const monthlySales = useMemo(() => (Array.isArray(data?.monthlySales) ? data.monthlySales : []), [data])
  const statisticsByMonth = useMemo(
    () => (Array.isArray(data?.statisticsByMonth) ? data.statisticsByMonth : []),
    [data]
  )
  const recentOrders = useMemo(() => (Array.isArray(data?.recentOrders) ? data.recentOrders : []), [data])
  const topProducts = useMemo(() => (Array.isArray(data?.topProducts) ? data.topProducts : []), [data])

  const monthlySalesValues = useMemo(() => monthlySales.map((row) => Number(row.sales) || 0), [monthlySales])
  const maxMonthlySales = useMemo(() => Math.max(1, ...monthlySalesValues), [monthlySalesValues])

  const overviewSeriesValues = useMemo(
    () => statisticsByMonth.map((row) => Number(row.overview) || 0),
    [statisticsByMonth]
  )
  const salesSeriesValues = useMemo(
    () => statisticsByMonth.map((row) => Number(row.sales) || 0),
    [statisticsByMonth]
  )
  const revenueSeriesValues = useMemo(
    () => statisticsByMonth.map((row) => Number(row.revenue) || 0),
    [statisticsByMonth]
  )

  const activeStatisticsKey = STATISTICS_KEY_BY_TAB[activeOverviewTab] || 'overview'
  const activeStatisticsValues = useMemo(() => {
    if (activeStatisticsKey === 'sales') return salesSeriesValues
    if (activeStatisticsKey === 'revenue') return revenueSeriesValues
    return overviewSeriesValues
  }, [activeStatisticsKey, overviewSeriesValues, salesSeriesValues, revenueSeriesValues])

  const maxStatisticsValue = useMemo(() => Math.max(1, ...activeStatisticsValues), [activeStatisticsValues])

  const filteredRecentOrders = useMemo(() => {
    if (activeOrderFilter === 'All') return recentOrders
    return recentOrders.filter((order) => mapStatusToLabel(order.status, isResortDashboard) === activeOrderFilter)
  }, [activeOrderFilter, isResortDashboard, recentOrders])

  const recentOrdersForView = useMemo(
    () =>
      filteredRecentOrders.map((order) => ({
        ...order,
        statusLabel: mapStatusToLabel(order.status, isResortDashboard),
        dateLabel: formatRecentOrderDateLabel(order.createdAt)
      })),
    [filteredRecentOrders, isResortDashboard]
  )

  const totalsForView = useMemo(() => {
    const totals = data?.totals || {}
    const trends = data?.trends || {}
    const monthTotals = data?.monthTotals || {}
    return {
      customers: Number(totals.customers) || 0,
      customersDeltaPct: Number(trends.customersDeltaPct) || 0,
      orders: Number(totals.orders) || 0,
      ordersDeltaPct: Number(trends.ordersDeltaPct) || 0,
      delivered: Number(totals.delivered) || 0,
      pending: Number(totals.pending) || 0,
      waitingForPayment: Number(totals.waitingForPayment) || 0,
      canceled: Number(totals.canceled) || 0,
      revenue: Number(totals.revenue) || 0,
      currentMonthOrders: Number(monthTotals.orders) || 0
    }
  }, [data])

  const monthlyTargetView = useMemo(() => {
    const target = data?.monthlyTarget || {}
    return {
      goal: Number(target.goal) || 0,
      achievedRatePct: Number(target.achievedRatePct) || 0,
      currentMonthRevenue: Number(target.currentMonthRevenue) || 0,
      todayRevenue: Number(target.todayRevenue) || 0,
      monthlyEarnings: Number(target.monthlyEarnings) || 0
    }
  }, [data])

  const yearOptions = useMemo(() => {
    const currentYear = resolveCurrentManilaYear()
    const start = currentYear - 4
    return Array.from({ length: 5 }, (_value, index) => start + index)
  }, [])

  const isEmpty = !isLoading && !data && !errorMessage
  const isUnavailable = Boolean(errorMessage) && !data

  const chartGeometry = useMemo(() => {
    const chartWidth = 900
    const chartHeight = 220
    const overviewPath = buildLinePath(overviewSeriesValues, chartWidth, chartHeight, maxStatisticsValue)
    const salesPath = buildLinePath(salesSeriesValues, chartWidth, chartHeight, maxStatisticsValue)
    const revenuePath = buildLinePath(revenueSeriesValues, chartWidth, chartHeight, maxStatisticsValue)
    const activePath = buildLinePath(activeStatisticsValues, chartWidth, chartHeight, maxStatisticsValue)
    const areaPath = activePath ? `${activePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : ''
    return { chartWidth, chartHeight, overviewPath, salesPath, revenuePath, activePath, areaPath }
  }, [
    overviewSeriesValues,
    salesSeriesValues,
    revenueSeriesValues,
    activeStatisticsValues,
    maxStatisticsValue
  ])

  const monthlyTopProducts = useMemo(() => {
    const maxSold = Math.max(1, ...topProducts.map((row) => Number(row.sold) || 0))
    return topProducts.map((row) => ({
      ...row,
      progressPct: Math.max(8, ((Number(row.sold) || 0) / maxSold) * 100)
    }))
  }, [topProducts])

  return {
    isLoading,
    isEmpty,
    isUnavailable,
    errorMessage,
    data,
    activeYear,
    yearOptions,
    handleSelectYear,
    refresh,
    overviewTabs: OVERVIEW_TABS,
    orderStatusFilters,
    activeOverviewTab,
    setActiveOverviewTab,
    activeOrderFilter,
    setActiveOrderFilter,
    monthlySales,
    statisticsByMonth,
    recentOrders: recentOrdersForView,
    topProducts: monthlyTopProducts,
    totals: totalsForView,
    monthlyTarget: monthlyTargetView,
    maxMonthlySales,
    maxStatisticsValue,
    chartGeometry,
    activeStatisticsKey,
    formatCurrency: toCurrencyPhp
  }
}
