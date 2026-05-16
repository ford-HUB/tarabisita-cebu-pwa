import { formatBillingPeso } from '../../../../shared/utils/billingDisplay.utils'
import { normalizeTransactionDisplayStatus } from './transactions.constants'

const csvEscape = (value) => {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export const buildPlanSubscriptionTransactionsCsv = (rows) => {
  const header = [
    'Order ID',
    'Business',
    'Owner',
    'Email',
    'Amount',
    'Currency',
    'Plan',
    'Months',
    'Status',
    'Created',
    'Paid at',
    'Subscription ends'
  ]
  const lines = rows.map((row) =>
    [
      row.orderId,
      row.businessName,
      row.customerName,
      row.email,
      row.amount,
      row.currency,
      row.planId,
      row.months,
      normalizeTransactionDisplayStatus(row.status),
      row.createdAt,
      row.paidAt,
      row.subscriptionEndsAt
    ].map(csvEscape).join(',')
  )
  return [header.join(','), ...lines].join('\r\n')
}

/** Aggregates counts and amounts by status for summaries and exports. */
export const computeTransactionSummaryMetrics = (rows) => {
  const byStatus = {}
  const amountByStatus = {}
  let totalAmount = 0
  let paidAmount = 0
  for (const row of rows) {
    const status = normalizeTransactionDisplayStatus(row.status || 'UNKNOWN')
    byStatus[status] = (byStatus[status] || 0) + 1
    const amt = Number(row.amount)
    const n = Number.isFinite(amt) ? amt : 0
    amountByStatus[status] = (amountByStatus[status] || 0) + n
    totalAmount += n
    if (status === 'PAID') paidAmount += n
  }
  return { byStatus, amountByStatus, totalAmount, paidAmount, rowCount: rows.length }
}

/**
 * Plain-text executive summary for the current (filtered / selected) transaction rows.
 */
export const buildPlanSubscriptionTransactionsSummary = (
  rows,
  { periodLabel, statusFilterLabel, searchQuery } = {}
) => {
  const lines = []
  lines.push('TaraBisita — Plan subscription transactions summary')
  lines.push(`Generated: ${new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`)
  lines.push('')
  lines.push('Filters applied')
  lines.push(`  Period: ${periodLabel ?? '—'}`)
  lines.push(`  Payment status: ${statusFilterLabel ?? '—'}`)
  const q = String(searchQuery || '').trim()
  if (q) lines.push(`  Search: ${q}`)
  lines.push('')
  lines.push(`Transactions included: ${rows.length}`)

  if (rows.length === 0) {
    return lines.join('\n')
  }

  const { byStatus, totalAmount, paidAmount } = computeTransactionSummaryMetrics(rows)

  lines.push('')
  lines.push('Count by payment status')
  for (const key of Object.keys(byStatus).sort()) {
    lines.push(`  ${key}: ${byStatus[key]}`)
  }

  lines.push('')
  lines.push(`Total amount (all included rows): ${formatBillingPeso(totalAmount)}`)
  lines.push(`Total amount (paid only): ${formatBillingPeso(paidAmount)}`)

  return lines.join('\n')
}

const compare = (a, b, dir) => {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a
  }
  const sa = String(a).toLowerCase()
  const sb = String(b).toLowerCase()
  if (sa < sb) return dir === 'asc' ? -1 : 1
  if (sa > sb) return dir === 'asc' ? 1 : -1
  return 0
}

export const sortTransactionRows = (rows, { key, dir }) => {
  const list = [...rows]
  list.sort((left, right) => {
    let va = left[key]
    let vb = right[key]
    if (key === 'createdAt' || key === 'paidAt' || key === 'subscriptionEndsAt' || key === 'updatedAt') {
      va = va ? new Date(va).getTime() : 0
      vb = vb ? new Date(vb).getTime() : 0
    }
    if (key === 'amount') {
      va = Number(va) || 0
      vb = Number(vb) || 0
    }
    return compare(va, vb, dir)
  })
  return list
}
