const ONLINE_PREPAID = new Set([
  'PREPAID_ONLINE',
  'GCASH',
  'MAYA',
  'GRAB_PAY',
  'CARD',
  'BANK_TRANSFER'
])

/** Menu orders paid online (not pay-at-pickup). */
export const isTouristOnlinePrepaidMenuOrder = (order) => {
  if (!order) return false
  if (String(order.orderType || '').toUpperCase() !== 'MENU_ORDER') return false
  if (String(order.statusKey || '').toUpperCase() === 'CANCELED') return false
  return ONLINE_PREPAID.has(String(order.billingType || '').toUpperCase())
}

export const canTouristRateRestaurantForOrder = (order) => isTouristOnlinePrepaidMenuOrder(order)
