import { FiChevronDown, FiChevronUp, FiMoreHorizontal } from 'react-icons/fi'
import { formatDate } from '../request-approval/utils'
import { formatBillingPeso } from '../../../../shared/utils/billingDisplay.utils'
import { paymentStatusPresentation } from './transactions.constants'

const SortHint = ({ active, dir }) => {
  if (!active) {
    return (
      <span className="ml-0.5 inline-flex flex-col text-[#c4b8a8]" aria-hidden>
        <FiChevronUp size={10} className="-mb-1" />
        <FiChevronDown size={10} />
      </span>
    )
  }
  return dir === 'asc' ? (
    <FiChevronUp size={12} className="ml-0.5 inline text-[#9b5a2c]" aria-hidden />
  ) : (
    <FiChevronDown size={12} className="ml-0.5 inline text-[#9b5a2c]" aria-hidden />
  )
}

const TransactionsTableSection = ({
  isLoading,
  rows,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAllVisible,
  allVisibleSelected,
  onOpenPaymentReview
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-[#fcfaf7] text-left text-xs uppercase tracking-wide text-[#9b5a2c]">
        <tr>
          <th className="w-10 px-3 py-3 md:px-5">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={onToggleAllVisible}
              className="h-4 w-4 rounded border-[#d8c7b3] text-[#9b5a2c] focus:ring-[#ff7a1a]"
              aria-label="Select all visible rows"
            />
          </th>
          <th className="px-2 py-3 md:px-4">Order ID</th>
          <th className="px-2 py-3">
            <button
              type="button"
              onClick={() => onSort('businessName')}
              className="inline-flex items-center font-semibold text-[#9b5a2c] transition hover:text-[#7a4522]"
            >
              Business
              <SortHint active={sortKey === 'businessName'} dir={sortDir} />
            </button>
          </th>
          <th className="hidden px-2 py-3 lg:table-cell">
            <button
              type="button"
              onClick={() => onSort('customerName')}
              className="inline-flex items-center font-semibold text-[#9b5a2c] transition hover:text-[#7a4522]"
            >
              Owner
              <SortHint active={sortKey === 'customerName'} dir={sortDir} />
            </button>
          </th>
          <th className="px-2 py-3">
            <button
              type="button"
              onClick={() => onSort('email')}
              className="inline-flex items-center font-semibold text-[#9b5a2c] transition hover:text-[#7a4522]"
            >
              Email
              <SortHint active={sortKey === 'email'} dir={sortDir} />
            </button>
          </th>
          <th className="px-2 py-3 text-right">
            <button
              type="button"
              onClick={() => onSort('amount')}
              className="inline-flex items-center font-semibold text-[#9b5a2c] transition hover:text-[#7a4522]"
            >
              Amount
              <SortHint active={sortKey === 'amount'} dir={sortDir} />
            </button>
          </th>
          <th className="hidden px-2 py-3 md:table-cell">
            <button
              type="button"
              onClick={() => onSort('subscriptionEndsAt')}
              className="inline-flex items-center font-semibold text-[#9b5a2c] transition hover:text-[#7a4522]"
            >
              Period end
              <SortHint active={sortKey === 'subscriptionEndsAt'} dir={sortDir} />
            </button>
          </th>
          <th className="px-2 py-3">Status</th>
          <th className="px-3 py-3 text-right md:px-5">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#6f655b]">
              Loading transactions...
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const ui = paymentStatusPresentation[row.status] || {
              label: row.status,
              tone: 'bg-[#f5f5f4] text-[#44403c]'
            }
            const checked = selectedIds.has(row.id)
            return (
              <tr key={row.id} className="border-t border-[#f1e8de] text-[#1f1f1f]">
                <td className="px-3 py-3 md:px-5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRow(row.id)}
                    className="h-4 w-4 rounded border-[#d8c7b3] text-[#9b5a2c] focus:ring-[#ff7a1a]"
                    aria-label={`Select row ${row.orderId}`}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-3 font-mono text-xs md:px-4">{row.orderId}</td>
                <td className="max-w-[160px] truncate px-2 py-3 font-medium" title={row.businessName}>
                  {row.businessName}
                </td>
                <td className="hidden max-w-[140px] truncate px-2 py-3 lg:table-cell" title={row.customerName}>
                  {row.customerName}
                </td>
                <td className="max-w-[200px] truncate px-2 py-3 text-[#5f5f5f]" title={row.email}>
                  {row.email}
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-right font-medium tabular-nums">
                  {formatBillingPeso(row.amount)}
                </td>
                <td className="hidden whitespace-nowrap px-2 py-3 text-[#5f5f5f] md:table-cell">
                  {formatDate(row.subscriptionEndsAt)}
                </td>
                <td className="px-2 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ui.tone}`}>
                    {ui.label}
                  </span>
                </td>
                <td className="px-3 py-3 text-right md:px-5">
                  <button
                    type="button"
                    onClick={() => onOpenPaymentReview?.(row.id)}
                    className="inline-flex rounded-lg border border-[#e7dfd5] p-1.5 text-[#6f655b] transition hover:bg-[#f5eee4]"
                    title="Review payment"
                    aria-label={`Review payment ${row.orderId}`}
                  >
                    <FiMoreHorizontal size={18} aria-hidden />
                  </button>
                </td>
              </tr>
            )
          })
        )}
        {!isLoading && rows.length === 0 && (
          <tr>
            <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#6f655b]">
              No plan subscription transactions for this range and filter.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

export default TransactionsTableSection
