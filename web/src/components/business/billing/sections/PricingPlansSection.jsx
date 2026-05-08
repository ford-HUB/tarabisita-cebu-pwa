import { pricingOptions as defaultPricingOptions } from '../constants/billing.constants'

const PricingPlansSection = ({
  pricingOptions = defaultPricingOptions,
  onChoosePlan,
  processingPlanId = null,
  isPlanSelectionLocked = false,
  planSelectionLockExpiresAtLabel = ''
}) => {
  return (
    <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">Choose a Plan Duration</h2>
        <p className="text-sm text-[#6d645d]">
          Select a billing cycle that matches your goals. Longer plans give better monthly value.
        </p>
        {isPlanSelectionLocked ? (
          <div className="mt-3 rounded-xl border border-[#e9dece] bg-[#fffaeb] px-3 py-2.5 text-xs text-[#6d645d]">
            <span className="font-semibold text-[#92400e]">Current plan still active.</span> You cannot start a new
            prepaid checkout until your paid period ends
            {planSelectionLockExpiresAtLabel && planSelectionLockExpiresAtLabel !== '—'
              ? ` (${planSelectionLockExpiresAtLabel}).`
              : '.'}
          </div>
        ) : null}
        <div className="mt-3 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] px-3 py-2 text-xs text-[#6d645d]">
          Checkout payment methods include <span className="font-semibold text-[#2f2f2f]">Card</span>,{' '}
          <span className="font-semibold text-[#2f2f2f]">GCash</span>,{' '}
          <span className="font-semibold text-[#2f2f2f]">PayMaya</span>, and{' '}
          <span className="font-semibold text-[#2f2f2f]">GrabPay</span> (availability depends on your PayMongo
          account configuration).
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {pricingOptions.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-4 transition ${
              plan.highlighted
                ? 'border-[#d8b79f] bg-[#fff8f1] shadow-sm'
                : 'border-[#efe7dc] bg-[#fcfaf7] hover:border-[#dcc6b3]'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-[#2f2f2f]">{plan.title}</h3>
              {plan.highlighted && (
                <span className="rounded-full bg-[#9b5a2c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Popular
                </span>
              )}
            </div>
            <p className="min-h-10 text-sm text-[#7e746b]">{plan.description}</p>
            <p className="mt-3 text-2xl font-bold text-[#2f2f2f]">{plan.monthlyRate}</p>
            <p className="text-xs text-[#9f9387]">per month</p>
            <p className="mt-3 text-sm text-[#6d645d]">{plan.billedAs}</p>
            <p className="text-sm font-semibold text-[#5f5f5f]">{plan.total}</p>

            <button
              type="button"
              onClick={() => onChoosePlan?.(plan)}
              disabled={Boolean(processingPlanId) || isPlanSelectionLocked}
              title={
                isPlanSelectionLocked
                  ? 'You can choose a new plan after your current prepaid period ends.'
                  : undefined
              }
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                plan.highlighted
                  ? 'bg-[#9b5a2c] text-white hover:bg-[#824b24]'
                  : 'border border-[#e1d4c5] text-[#5f5f5f] hover:bg-[#f7f3ed]'
              } ${processingPlanId || isPlanSelectionLocked ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {processingPlanId === plan.id ? 'Redirecting to checkout...' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </article>
  )
}

export default PricingPlansSection
