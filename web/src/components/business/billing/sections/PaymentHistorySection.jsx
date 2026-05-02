import {
  ledgerPaymentStatusLabels,
  paymentPurposeLabels
} from '../constants/billing.constants'
import { formatBillingDateTime, formatBillingPeso } from '../../../../shared/utils/billingDisplay.utils'

const PaymentHistorySection = ({ payments = [], isLoading = false }) => {
  return (
    <article className="rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <header className="border-b border-[#f0e8de] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">Payment history</h2>
        <p className="mt-0.5 text-xs text-[#6d645d]">Recorded charges for this business (includes pending checkouts).</p>
      </header>

      <div className="overflow-x-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f0e8de]" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6d645d]">No payments recorded yet.</p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe7dc] text-xs uppercase tracking-wide text-[#a19384]">
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Purpose</th>
                <th className="pb-2 pr-3 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#2f2f2f]">
              {payments.map((row) => (
                <tr key={row.id} className="border-b border-[#f7f0e8] last:border-0">
                  <td className="py-2.5 pr-3 align-top text-[#6d645d]">
                    {formatBillingDateTime(row.paidAt || row.createdAt)}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    {paymentPurposeLabels[row.type] || row.type || '—'}
                  </td>
                  <td className="py-2.5 pr-3 align-top font-medium">{formatBillingPeso(row.amount)}</td>
                  <td className="py-2.5 align-top">
                    <span className="rounded-full bg-[#fcfaf7] px-2 py-0.5 text-xs font-medium text-[#5f4b32]">
                      {ledgerPaymentStatusLabels[row.status] || row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </article>
  )
}

export default PaymentHistorySection
