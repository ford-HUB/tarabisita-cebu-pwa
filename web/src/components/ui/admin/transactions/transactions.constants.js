export const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
]

export const PAYMENT_STATUS_FILTER = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

export const paymentStatusPresentation = {
  PAID: { label: 'Completed', tone: 'bg-[#dcfce7] text-[#166534]' },
  PENDING: { label: 'Pending', tone: 'bg-[#ffedd5] text-[#c2410c]' },
  FAILED: { label: 'Failed', tone: 'bg-[#fee4e2] text-[#b42318]' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-[#f5f5f4] text-[#57534e]' }
}
