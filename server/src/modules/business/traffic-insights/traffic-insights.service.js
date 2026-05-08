import Business from '../models/business.model.js'
import CustomerOrder from '../customer-orders/models/customer-order.model.js'

const resolveBusinessCategorySlug = (business) => {
  const category =
    typeof business?.category === 'object' && business?.category?.name != null
      ? String(business.category.name).trim().toUpperCase()
      : String(business?.category || '').trim().toUpperCase()
  if (category === 'RESTAURANT') return 'restaurant'
  if (category === 'RESORT' || category === 'HOTEL') return 'resort'
  return 'other'
}

const resolveManilaDateLabel = (dateInput) => {
  const parsed = String(dateInput || '').trim()
  if (parsed && /^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

const resolveManilaRange = (dateInput) => {
  const day = resolveManilaDateLabel(dateInput)
  return {
    day,
    startAt: new Date(`${day}T00:00:00.000+08:00`),
    endAt: new Date(`${day}T23:59:59.999+08:00`)
  }
}

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0))

const toHourLabel = (value) => `${String(value).padStart(2, '0')}:00`

const mapOrdersByHour = (orders = []) => {
  const counts = new Map()
  for (let i = 0; i < 24; i += 1) counts.set(i, 0)
  for (const order of orders) {
    const date = order?.createdAt ? new Date(order.createdAt) : null
    if (!date || Number.isNaN(date.getTime())) continue
    const manilaHour = Number(
      new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Manila' }).format(date)
    )
    if (Number.isInteger(manilaHour) && manilaHour >= 0 && manilaHour <= 23) {
      counts.set(manilaHour, (counts.get(manilaHour) || 0) + 1)
    }
  }
  return [...counts.entries()].map(([hour, orders]) => ({ hour: toHourLabel(hour), orders }))
}

export const getMyTrafficInsightsByUserId = async (userId, dateInput) => {
  const business = await Business.findOne({ userId }).populate('category', 'name').lean()
  if (!business) throw new Error('BUSINESS_NOT_FOUND')
  const categorySlug = resolveBusinessCategorySlug(business)
  if (categorySlug !== 'restaurant' && categorySlug !== 'resort') throw new Error('MENU_ORDERS_NOT_AVAILABLE')

  const { day, startAt, endAt } = resolveManilaRange(dateInput)
  const dailyOrders = await CustomerOrder.find({
    businessId: business._id,
    createdAt: { $gte: startAt, $lte: endAt }
  })
    .select('status createdAt')
    .lean()

  const totalViews = Math.max(0, Number(business.publicProfileViewCount) || 0)
  const totalOrdersToday = dailyOrders.length
  const completedToday = dailyOrders.filter((order) => order.status === 'FINISHED').length
  const canceledToday = dailyOrders.filter((order) => order.status === 'CANCELED').length
  const conversionRate = totalViews > 0 ? (completedToday / totalViews) * 100 : 0
  const completionRate = totalOrdersToday > 0 ? (completedToday / totalOrdersToday) * 100 : 0

  return {
    business: { id: String(business._id), name: business.name || 'Business', category: categorySlug },
    date: day,
    reportBasis: categorySlug === 'resort' ? 'bookings' : 'orders',
    summary: {
      publicProfileViews: totalViews,
      totalOrdersToday,
      completedOrdersToday: completedToday,
      canceledOrdersToday: canceledToday,
      totalBookingsToday: totalOrdersToday,
      completedBookingsToday: completedToday,
      canceledBookingsToday: canceledToday,
      conversionRatePct: Number(clampPercent(conversionRate).toFixed(2)),
      completionRatePct: Number(clampPercent(completionRate).toFixed(2))
    },
    ordersByHour: mapOrdersByHour(dailyOrders),
    generatedAt: new Date().toISOString()
  }
}
