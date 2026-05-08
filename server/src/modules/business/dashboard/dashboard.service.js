import Business from '../models/business.model.js'
import CustomerOrder from '../customer-orders/models/customer-order.model.js'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MANILA_TIME_ZONE = 'Asia/Manila'
const DEFAULT_RECENT_ORDERS_LIMIT = 8
const DEFAULT_TOP_PRODUCTS_LIMIT = 5
const DEFAULT_MONTHLY_TARGET_GOAL = 50000

const resolveBusinessCategory = (business) => {
  const category =
    typeof business?.category === 'object' && business?.category?.name != null
      ? String(business.category.name).trim().toUpperCase()
      : String(business?.category || '').trim().toUpperCase()
  return category
}

const resolveDashboardOrderType = (business) => {
  const category = resolveBusinessCategory(business)
  if (category === 'RESTAURANT') return 'MENU_ORDER'
  if (category === 'RESORT' || category === 'HOTEL') return 'BOOKING_REQUEST'
  return ''
}

const resolveManilaToday = () => {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: MANILA_TIME_ZONE })
}

const resolveManilaYearFromInput = (yearInput) => {
  const parsed = Number(yearInput)
  if (Number.isInteger(parsed) && parsed >= 2000 && parsed <= 9999) return parsed
  const today = resolveManilaToday()
  return Number(today.slice(0, 4))
}

const resolveManilaMonthFromInput = (monthInput) => {
  const trimmed = String(monthInput || '').trim()
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) return trimmed
  return resolveManilaToday().slice(0, 7)
}

const buildManilaYearRange = (year) => ({
  startAt: new Date(`${year}-01-01T00:00:00.000+08:00`),
  endAt: new Date(`${year}-12-31T23:59:59.999+08:00`)
})

const buildManilaMonthRange = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map((value) => Number(value))
  const startAt = new Date(`${yearMonth}-01T00:00:00.000+08:00`)
  const endMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
  const endAt = new Date(`${endMonth}-01T00:00:00.000+08:00`)
  return { startAt, endAt }
}

const buildManilaDayRange = (dayLabel) => ({
  startAt: new Date(`${dayLabel}T00:00:00.000+08:00`),
  endAt: new Date(`${dayLabel}T23:59:59.999+08:00`)
})

const previousYearMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map((value) => Number(value))
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

const safeNumber = (value) => {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

const round2 = (value) => Math.round(safeNumber(value) * 100) / 100

const clampPercent = (value) => Math.max(0, Math.min(100, safeNumber(value)))

const computeDeltaPct = (current, previous) => {
  const currentN = safeNumber(current)
  const previousN = safeNumber(previous)
  if (previousN === 0) return currentN > 0 ? 100 : 0
  return round2(((currentN - previousN) / previousN) * 100)
}

const resolveManilaMonthIndex = (date) => {
  if (!date) return null
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: MANILA_TIME_ZONE }).format(date)
  const index = MONTH_LABELS.indexOf(month)
  return index >= 0 ? index : null
}

const formatPhpAmount = (amount) => {
  const value = safeNumber(amount)
  return `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const normalizeMenuLookupKey = (value) => String(value || '').trim().toLowerCase()

/**
 * Strips suffixes appended at order-time so the trailing label
 * (e.g. "Item ×2", "Item (+3 more)") still matches the underlying menu item name.
 */
const stripProductNameSuffix = (productName) => {
  const raw = String(productName || '').trim()
  if (!raw) return ''
  const withoutMore = raw.replace(/\s*\(\+\d+\s*more\)\s*$/i, '')
  const withoutQuantity = withoutMore.replace(/\s*[×x]\s*\d+\s*$/i, '')
  return withoutQuantity.trim()
}

const buildMenuCategoryLookup = (business) => {
  const byId = new Map()
  const byName = new Map()
  const items = Array.isArray(business?.menuItems) ? business.menuItems : []
  for (const item of items) {
    const category = String(item?.category || '').trim() || 'Uncategorized'
    if (item?._id) {
      byId.set(String(item._id), category)
    }
    const nameKey = normalizeMenuLookupKey(item?.name)
    if (nameKey) {
      byName.set(nameKey, category)
    }
  }
  return { byId, byName }
}

/**
 * Order rows may be missing `lineItems` (legacy data) or carry a stale
 * `menuItemId`, so we cascade through id → line name → product name (de-suffixed).
 */
const resolveOrderCategory = (order, menuCategoryLookup) => {
  const lines = Array.isArray(order?.lineItems) ? order.lineItems : []
  for (const line of lines) {
    const id = line?.menuItemId ? String(line.menuItemId) : ''
    if (id && menuCategoryLookup.byId.has(id)) {
      return menuCategoryLookup.byId.get(id) || 'Uncategorized'
    }
  }
  for (const line of lines) {
    const nameKey = normalizeMenuLookupKey(line?.name)
    if (nameKey && menuCategoryLookup.byName.has(nameKey)) {
      return menuCategoryLookup.byName.get(nameKey) || 'Uncategorized'
    }
  }
  const productKey = normalizeMenuLookupKey(stripProductNameSuffix(order?.productName))
  if (productKey && menuCategoryLookup.byName.has(productKey)) {
    return menuCategoryLookup.byName.get(productKey) || 'Uncategorized'
  }
  return 'Uncategorized'
}

const aggregateMonthlySalesAndStatistics = (orders) => {
  const sales = MONTH_LABELS.map((month) => ({ month, sales: 0, revenue: 0 }))
  const statistics = MONTH_LABELS.map((month) => ({ month, overview: 0, sales: 0, revenue: 0 }))

  for (const order of orders) {
    const monthIndex = resolveManilaMonthIndex(order.createdAt)
    if (monthIndex == null) continue
    const isFinished = order.status === 'FINISHED'
    const itemsCount = safeNumber(order.itemsCount)

    statistics[monthIndex].overview += 1
    if (isFinished) {
      statistics[monthIndex].sales += 1
      statistics[monthIndex].revenue += safeNumber(order.amount)
      sales[monthIndex].sales += itemsCount > 0 ? itemsCount : 1
      sales[monthIndex].revenue += safeNumber(order.amount)
    }
  }

  for (const row of sales) row.revenue = round2(row.revenue)
  for (const row of statistics) row.revenue = round2(row.revenue)

  return { monthlySales: sales, statisticsByMonth: statistics }
}

const aggregateTopProducts = (orders, limit) => {
  const tally = new Map()
  for (const order of orders) {
    if (order.status !== 'FINISHED') continue
    const lines = Array.isArray(order.lineItems) ? order.lineItems : []
    if (lines.length === 0) {
      const fallbackName = stripProductNameSuffix(order.productName) || 'Unspecified item'
      const current = tally.get(fallbackName) || { name: fallbackName, sold: 0, revenue: 0 }
      const itemsCount = Math.max(1, safeNumber(order.itemsCount))
      current.sold += itemsCount
      current.revenue += safeNumber(order.amount)
      tally.set(fallbackName, current)
      continue
    }
    for (const line of lines) {
      const key = String(line?.name || line?.menuItemId || 'Unspecified item').trim() || 'Unspecified item'
      const current = tally.get(key) || { name: key, sold: 0, revenue: 0 }
      const qty = Math.max(1, safeNumber(line?.qty))
      const unit = safeNumber(line?.unit)
      current.sold += qty
      current.revenue += qty * unit
      tally.set(key, current)
    }
  }
  return [...tally.values()]
    .map((row) => ({ name: row.name, sold: row.sold, revenue: round2(row.revenue) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit)
}

const buildRecentOrders = (orders, menuCategoryLookup, limit) => {
  return orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((order) => ({
      id: String(order._id),
      orderCode: order.orderCode || '',
      customer: order.customerName || '',
      productName: order.productName || '',
      productImage: order.productImage || '',
      category: resolveOrderCategory(order, menuCategoryLookup),
      itemsCount: safeNumber(order.itemsCount),
      amount: round2(order.amount),
      total: formatPhpAmount(order.amount),
      status: order.status,
      createdAt: order.createdAt
    }))
}

const buildCustomersTotal = (orders) => {
  const placedByUserSet = new Set()
  const fallbackKeys = new Set()
  for (const order of orders) {
    if (order.placedByUserId) {
      placedByUserSet.add(String(order.placedByUserId))
      continue
    }
    const fallback = `${order.customerName || ''}|${order.customerPhone || ''}`.toLowerCase()
    if (fallback.trim() !== '|') fallbackKeys.add(fallback)
  }
  return placedByUserSet.size + fallbackKeys.size
}

const countOrdersByStatus = (orders, status) =>
  orders.reduce((count, order) => {
    return String(order?.status || '').toUpperCase() === String(status || '').toUpperCase() ? count + 1 : count
  }, 0)

const buildOrdersBuckets = (orders) => {
  const delivered = countOrdersByStatus(orders, 'FINISHED')
  const canceled = countOrdersByStatus(orders, 'CANCELED')
  const waitingForApproval = countOrdersByStatus(orders, 'PLACED')
  const waitingForPayment = countOrdersByStatus(orders, 'PROCESSING')
  const pending = waitingForApproval + waitingForPayment
  let revenue = 0

  for (const order of orders) {
    if (String(order?.status || '').toUpperCase() === 'FINISHED') {
      revenue += safeNumber(order.amount)
    }
  }

  return {
    total: orders.length,
    delivered,
    pending,
    canceled,
    waitingForApproval,
    waitingForPayment,
    revenue: round2(revenue)
  }
}

export const getMyBusinessDashboardByUserId = async (userId, { year, month } = {}) => {
  const business = await Business.findOne({ userId }).populate('category', 'name').lean()
  if (!business) throw new Error('BUSINESS_NOT_FOUND')
  const dashboardOrderType = resolveDashboardOrderType(business)
  if (!dashboardOrderType) throw new Error('MENU_DASHBOARD_NOT_AVAILABLE')

  const resolvedYear = resolveManilaYearFromInput(year)
  const resolvedMonth = resolveManilaMonthFromInput(month)
  const today = resolveManilaToday()

  const yearRange = buildManilaYearRange(resolvedYear)
  const monthRange = buildManilaMonthRange(resolvedMonth)
  const previousMonthRange = buildManilaMonthRange(previousYearMonth(resolvedMonth))
  const todayRange = buildManilaDayRange(today)

  const orderTypeFilter = { orderType: dashboardOrderType }
  const [yearOrders, currentMonthOrders, previousMonthOrders, todayOrders] = await Promise.all([
    CustomerOrder.find({
      businessId: business._id,
      ...orderTypeFilter,
      createdAt: { $gte: yearRange.startAt, $lte: yearRange.endAt }
    }).lean(),
    CustomerOrder.find({
      businessId: business._id,
      ...orderTypeFilter,
      createdAt: { $gte: monthRange.startAt, $lt: monthRange.endAt }
    }).lean(),
    CustomerOrder.find({
      businessId: business._id,
      ...orderTypeFilter,
      createdAt: { $gte: previousMonthRange.startAt, $lt: previousMonthRange.endAt }
    }).lean(),
    CustomerOrder.find({
      businessId: business._id,
      ...orderTypeFilter,
      createdAt: { $gte: todayRange.startAt, $lte: todayRange.endAt }
    }).lean()
  ])

  const menuCategoryLookup = buildMenuCategoryLookup(business)
  const yearBuckets = buildOrdersBuckets(yearOrders)
  const monthBuckets = buildOrdersBuckets(currentMonthOrders)
  const previousMonthBuckets = buildOrdersBuckets(previousMonthOrders)
  const todayBuckets = buildOrdersBuckets(todayOrders)

  const customersThisMonth = buildCustomersTotal(currentMonthOrders)
  const customersPreviousMonth = buildCustomersTotal(previousMonthOrders)
  const customersTotal = buildCustomersTotal(yearOrders)
  const isBookingDashboard = dashboardOrderType === 'BOOKING_REQUEST'
  const confirmedYearCount = countOrdersByStatus(yearOrders, 'FINISHED')
  const confirmedMonthCount = countOrdersByStatus(currentMonthOrders, 'FINISHED')
  const confirmedPreviousMonthCount = countOrdersByStatus(previousMonthOrders, 'FINISHED')

  const { monthlySales, statisticsByMonth } = aggregateMonthlySalesAndStatistics(yearOrders)
  const topProducts = aggregateTopProducts(yearOrders, DEFAULT_TOP_PRODUCTS_LIMIT)
  const recentOrders = buildRecentOrders(yearOrders, menuCategoryLookup, DEFAULT_RECENT_ORDERS_LIMIT)

  const monthlyTargetGoal = DEFAULT_MONTHLY_TARGET_GOAL
  const achievedRate = monthlyTargetGoal > 0 ? clampPercent((monthBuckets.revenue / monthlyTargetGoal) * 100) : 0
  const monthlyEarnings = round2(monthBuckets.revenue * 0.31)

  return {
    business: {
      id: String(business._id),
      name: business.name || 'Business'
    },
    scope: dashboardOrderType,
    year: resolvedYear,
    month: resolvedMonth,
    today,
    totals: {
      customers: customersTotal,
      orders: isBookingDashboard ? confirmedYearCount : yearBuckets.total,
      delivered: yearBuckets.delivered,
      pending: isBookingDashboard ? yearBuckets.waitingForApproval : yearBuckets.pending,
      waitingForPayment: isBookingDashboard ? yearBuckets.waitingForPayment : 0,
      canceled: yearBuckets.canceled,
      revenue: yearBuckets.revenue
    },
    monthTotals: {
      customers: customersThisMonth,
      orders: isBookingDashboard ? confirmedMonthCount : monthBuckets.total,
      delivered: monthBuckets.delivered,
      pending: isBookingDashboard ? monthBuckets.waitingForApproval : monthBuckets.pending,
      waitingForPayment: isBookingDashboard ? monthBuckets.waitingForPayment : 0,
      canceled: monthBuckets.canceled,
      revenue: monthBuckets.revenue
    },
    todayTotals: {
      orders: todayBuckets.total,
      delivered: todayBuckets.delivered,
      pending: todayBuckets.pending,
      canceled: todayBuckets.canceled,
      revenue: todayBuckets.revenue
    },
    trends: {
      customersDeltaPct: computeDeltaPct(customersThisMonth, customersPreviousMonth),
      ordersDeltaPct: computeDeltaPct(
        isBookingDashboard ? confirmedMonthCount : monthBuckets.total,
        isBookingDashboard ? confirmedPreviousMonthCount : previousMonthBuckets.total
      ),
      revenueDeltaPct: computeDeltaPct(monthBuckets.revenue, previousMonthBuckets.revenue)
    },
    monthlySales,
    statisticsByMonth,
    monthlyTarget: {
      goal: monthlyTargetGoal,
      achievedRatePct: round2(achievedRate),
      currentMonthRevenue: monthBuckets.revenue,
      todayRevenue: todayBuckets.revenue,
      monthlyEarnings
    },
    recentOrders,
    topProducts,
    generatedAt: new Date().toISOString()
  }
}
