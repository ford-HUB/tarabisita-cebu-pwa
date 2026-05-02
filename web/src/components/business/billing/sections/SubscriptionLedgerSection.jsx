import {
  ledgerSubscriptionStatusLabels,
  subscriptionPlanIdLabels
} from '../constants/billing.constants'
import { formatBillingDateTime, formatBillingPeso, formatUtcPeriodLine } from '../../../../shared/utils/billingDisplay.utils'

const SubscriptionLedgerSection = ({ subscriptions = [], isLoading = false }) => {
  return (
    <article className="rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <header className="border-b border-[#f0e8de] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">Subscription periods</h2>
        <p className="mt-0.5 text-xs text-[#6d645d]">
          One row per paid cycle, with UTC calendar breakdown (year, month, day, time).
        </p>
      </header>

      <div className="overflow-x-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f0e8de]" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6d645d]">No subscription periods recorded yet.</p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe7dc] text-xs uppercase tracking-wide text-[#a19384]">
                <th className="pb-2 pr-3 font-medium">Plan</th>
                <th className="pb-2 pr-3 font-medium">Period</th>
                <th className="pb-2 pr-3 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#2f2f2f]">
              {subscriptions.map((row) => (
                <tr key={row.id} className="border-b border-[#f7f0e8] last:border-0">
                  <td className="py-2.5 pr-3 align-top font-medium">
                    {subscriptionPlanIdLabels[row.planId] || row.planId || '—'}
                  </td>
                  <td className="max-w-[280px] py-2.5 pr-3 align-top text-[#6d645d]">
                    <p className="text-xs">
                      Local: {formatBillingDateTime(row.startedAt)} → {formatBillingDateTime(row.expiresAt)}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-[#9f9387]">{formatUtcPeriodLine(row.period)}</p>
                  </td>
                  <td className="py-2.5 pr-3 align-top font-medium">{formatBillingPeso(row.amount)}</td>
                  <td className="py-2.5 align-top">
                    <span className="rounded-full bg-[#fcfaf7] px-2 py-0.5 text-xs font-medium text-[#5f4b32]">
                      {ledgerSubscriptionStatusLabels[row.status] || row.status}
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

export default SubscriptionLedgerSection
