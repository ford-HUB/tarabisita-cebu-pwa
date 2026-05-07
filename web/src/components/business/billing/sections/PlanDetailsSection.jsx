import { FiAlertCircle, FiCheck, FiClock, FiX } from 'react-icons/fi'
import { freeTierSummary as defaultFreeTierSummary, planBenefits as defaultPlanBenefits } from '../constants/billing.constants'

const statusBadgeClass = (effectiveStatus) => {
  if (effectiveStatus === 'ACTIVE') {
    return 'bg-[#ecfdf3] text-[#027a48]'
  }
  if (effectiveStatus === 'EXPIRED') {
    return 'bg-[#fffaeb] text-[#b54708]'
  }
  if (effectiveStatus === 'CANCELLED' || effectiveStatus === 'FAILED') {
    return 'bg-[#fef3f2] text-[#b42318]'
  }
  return 'bg-[#f2f4f7] text-[#344054]'
}

const PlanDetailsSection = ({
  hasActivePlan,
  isPlanSelectionLocked = false,
  planSubscriptionSummary = null,
  showPastOrFailedPlan = false,
  monthlyCapacity = null,
  planBenefits = defaultPlanBenefits,
  freeTierSummary = defaultFreeTierSummary,
  onOpenAvailablePlans,
  onOpenCompareFeatures
}) => {
  const usedOrders = Number(monthlyCapacity?.used) || 0
  const capOrders = Number.isFinite(Number(monthlyCapacity?.cap)) ? Number(monthlyCapacity.cap) : null
  const remainingOrders =
    Number.isFinite(Number(monthlyCapacity?.remaining)) && capOrders != null
      ? Math.max(Number(monthlyCapacity.remaining), 0)
      : null
  const formatCount = (value) => new Intl.NumberFormat('en-PH').format(Number(value) || 0)

  return (
    <article className="rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <header className="border-b border-[#f0e8de] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">Plan Details</h2>
      </header>

      {hasActivePlan && planSubscriptionSummary ? (
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-[#efe7dc] bg-[#fcfaf7] p-4">
            <div className="space-y-1 border-b border-[#efe7dc] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Current plan</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                    planSubscriptionSummary.effectiveStatus
                  )}`}
                >
                  {planSubscriptionSummary.statusLabel}
                </span>
              </div>
              <p className="text-lg font-semibold text-[#2f2f2f]">{planSubscriptionSummary.planTitle}</p>
            </div>

            <div className="space-y-3 text-sm text-[#6d645d]">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a19384]">Billing cycle</p>
                <p className="mt-1 text-base font-semibold text-[#2f2f2f]">{planSubscriptionSummary.cycleLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a19384]">Amount paid (this cycle)</p>
                <p className="mt-1 text-base font-semibold text-[#2f2f2f]">{planSubscriptionSummary.amountLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a19384]">Period start</p>
                <p className="mt-1 text-base font-semibold text-[#2f2f2f]">{planSubscriptionSummary.startedAtLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a19384]">Period end</p>
                <p className="mt-1 text-base font-semibold text-[#2f2f2f]">{planSubscriptionSummary.expiresAtLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a19384]">This month order capacity</p>
                <p className="mt-1 text-base font-semibold text-[#2f2f2f]">
                  {formatCount(usedOrders)} / {capOrders == null ? 'Unlimited' : formatCount(capOrders)}
                </p>
                {remainingOrders != null ? (
                  <p className="mt-1 text-xs text-[#6d645d]">{formatCount(remainingOrders)} remaining this month</p>
                ) : (
                  <p className="mt-1 text-xs text-[#6d645d]">No monthly cap on your active plan</p>
                )}
              </div>
            </div>

            <p className="rounded-xl border border-[#e9dece] bg-white px-3 py-2.5 text-xs text-[#6d645d]">
              Your prepaid window is counted from the exact time checkout completed, for the number of months in your
              plan. After the period end, you can purchase a new billing cycle to keep premium access.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#2f2f2f]">Plan Benefits</h3>
            <ul className="space-y-2.5">
              {planBenefits.map((benefit) => (
                <li
                  key={benefit.label}
                  className={`flex items-center gap-2 text-sm ${
                    benefit.included ? 'text-[#2f2f2f]' : 'text-[#a79a8b]'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      benefit.included ? 'bg-[#ecfdf3] text-[#12b76a]' : 'bg-[#f9fafb] text-[#98a2b3]'
                    }`}
                  >
                    {benefit.included ? <FiCheck size={12} /> : <FiX size={12} />}
                  </span>
                  {benefit.label}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 pt-4">
              {isPlanSelectionLocked ? (
                <p className="rounded-xl border border-[#efe7dc] bg-[#fcfaf7] px-3 py-2 text-xs text-[#6d645d]">
                  Plan changes are disabled until your current prepaid period ends
                  {planSubscriptionSummary?.expiresAtLabel && planSubscriptionSummary.expiresAtLabel !== '—'
                    ? ` (${planSubscriptionSummary.expiresAtLabel}).`
                    : '.'}{' '}
                  You can choose a new billing cycle after that time.
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAvailablePlans?.()}
                  disabled={isPlanSelectionLocked}
                  title={
                    isPlanSelectionLocked
                      ? 'You can choose a new plan after your current period ends.'
                      : undefined
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isPlanSelectionLocked
                      ? 'cursor-not-allowed bg-[#e7dfd5] text-[#8a8076]'
                      : 'bg-[#9b5a2c] text-white hover:bg-[#824b24]'
                  }`}
                >
                  View plans & renew
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCompareFeatures?.()}
                  className="rounded-xl border border-[#e1d4c5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
                >
                  Compare features
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : showPastOrFailedPlan && planSubscriptionSummary ? (
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-2xl border border-[#efe7dc] bg-[#fcfaf7] p-4">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fffaeb] text-[#b54708]">
              <FiAlertCircle size={18} />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-[#2f2f2f]">{planSubscriptionSummary.planTitle}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                    planSubscriptionSummary.effectiveStatus
                  )}`}
                >
                  {planSubscriptionSummary.statusLabel}
                </span>
              </div>
              <dl className="grid gap-2 text-sm text-[#6d645d] sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[#a19384]">Period start</dt>
                  <dd className="mt-0.5 font-medium text-[#2f2f2f]">{planSubscriptionSummary.startedAtLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[#a19384]">Period end</dt>
                  <dd className="mt-0.5 font-medium text-[#2f2f2f]">{planSubscriptionSummary.expiresAtLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[#a19384]">Cycle</dt>
                  <dd className="mt-0.5 font-medium text-[#2f2f2f]">{planSubscriptionSummary.cycleLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[#a19384]">Last amount</dt>
                  <dd className="mt-0.5 font-medium text-[#2f2f2f]">{planSubscriptionSummary.amountLabel}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenAvailablePlans?.()}
                  className="rounded-xl bg-[#9b5a2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#824b24]"
                >
                  Choose a plan
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="rounded-2xl border border-dashed border-[#dbc8b5] bg-[#fcfaf7] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f5eee4] text-[#9b5a2c]">
                <FiClock size={16} />
              </span>
              <div>
                <p className="text-lg font-semibold text-[#2f2f2f]">No active plan yet</p>
                <p className="mt-1 text-sm text-[#6d645d]">
                  Your business account is currently on free access. Choose a plan below to unlock premium visibility and
                  advanced business tools. Stores on a free account are not published on the customer page.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {freeTierSummary.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#efe7dc] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[#a19384]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-[#2f2f2f]">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAvailablePlans?.()}
              className="rounded-xl bg-[#9b5a2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#824b24]"
            >
              View Available Plans
            </button>
            <button
              type="button"
              onClick={() => onOpenCompareFeatures?.()}
              className="rounded-xl border border-[#e1d4c5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
            >
              Compare Features
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default PlanDetailsSection
