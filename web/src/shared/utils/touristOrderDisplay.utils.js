/** Matches server `CustomerOrder.status` (PLACED → PROCESSING → FINISHED / CANCELED). */
export const touristCustomerOrderStatusLabel = (status, orderType) => {
  const s = String(status || '').toUpperCase()
  const t = String(orderType || '').toUpperCase()

  // Restaurant menu orders: show kitchen workflow (not resort payment workflow).
  if (t === 'MENU_ORDER') {
    if (s === 'PLACED') return 'Waiting to process'
    if (s === 'PROCESSING') return 'Processing'
    if (s === 'FINISHED') return 'Finished'
    if (s === 'CANCELED') return 'Canceled'
    return status ? String(status) : ''
  }

  // Booking requests (resort/hotel) and legacy rows: keep existing wording.
  if (s === 'PLACED') return 'Waiting for approval'
  if (s === 'PROCESSING') return 'Approved - waiting for payment'
  if (s === 'FINISHED') return 'Completed'
  if (s === 'CANCELED') return 'Canceled'
  return status ? String(status) : ''
}

export const touristCustomerOrderStatusBadgeClass = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'PROCESSING') return 'bg-[#fff8dd] text-[#9c6a12]'
  if (s === 'FINISHED') return 'bg-[#e8f8ec] text-[#2a7b45]'
  if (s === 'CANCELED') return 'bg-[#f1f1f1] text-[#5c5c5c]'
  return 'bg-[#fff0e3] text-[#9b5a2c]'
}
