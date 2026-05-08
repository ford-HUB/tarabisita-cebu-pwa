const statusChipClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID' || normalized === 'SUCCEEDED' || normalized === 'SUCCESSFUL') {
    return 'bg-[#dcfce7] text-[#166534]'
  }
  if (normalized === 'PENDING') {
    return 'bg-[#fef3c7] text-[#92400e]'
  }
  if (normalized === 'FAILED') {
    return 'bg-[#fee2e2] text-[#991b1b]'
  }
  return 'bg-[#f3f4f6] text-[#374151]'
}

const AdminDashboardRecentTransactionsSection = ({ rows, formatCurrency, formatDate }) => (
  <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-[#1f1f1f]">Recent plan transactions</h2>
    <p className="mt-1 text-sm text-[#7a7169]">Latest billing activity for subscription purchases.</p>

    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#fcfaf7] text-left text-xs uppercase tracking-wide text-[#9b5a2c]">
          <tr>
            <th className="px-3 py-2">Business</th>
            <th className="px-3 py-2">Plan</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-5 text-center text-sm text-[#7a7169]">
                No transactions found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id || row.orderId} className="border-t border-[#f1e8de] text-[#2f2f2f]">
                <td className="px-3 py-2.5">{row.businessName || '—'}</td>
                <td className="px-3 py-2.5">{row.planId || '—'}</td>
                <td className="px-3 py-2.5">{formatCurrency(row.amount)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusChipClass(row.status)}`}>
                    {row.status || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-3 py-2.5">{formatDate(row.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </article>
)

export default AdminDashboardRecentTransactionsSection
