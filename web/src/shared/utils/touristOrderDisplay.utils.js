/** Matches server `CustomerOrder.status` (PLACED → PROCESSING → FINISHED / CANCELED). */
export const touristCustomerOrderStatusLabel = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'PLACED':
      return 'Waiting for approval'
    case 'PROCESSING':
      return 'Approved - waiting for payment'
    case 'FINISHED':
      return 'Completed'
    case 'CANCELED':
      return 'Canceled'
    default:
      return status ? String(status) : ''
  }
}

export const touristCustomerOrderStatusBadgeClass = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'PROCESSING') return 'bg-[#fff8dd] text-[#9c6a12]'
  if (s === 'FINISHED') return 'bg-[#e8f8ec] text-[#2a7b45]'
  if (s === 'CANCELED') return 'bg-[#f1f1f1] text-[#5c5c5c]'
  return 'bg-[#fff0e3] text-[#9b5a2c]'
}
