import { FiX } from 'react-icons/fi'
import { pricingOptions as defaultPricingOptions } from '../constants/billing.constants'

const AvailablePlansModal = ({
  isOpen,
  onClose,
  onChoosePlan,
  processingPlanId = null,
  pricingOptions = defaultPricingOptions,
  isPlanSelectionLocked = false,
  planSelectionLockExpiresAtLabel = ''
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="available-plans-modal-title"
        className="max-h-[min(90vh,720px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#f0e8de] px-5 py-4">
          <div>
            <h2 id="available-plans-modal-title" className="text-lg font-semibold text-[#2f2f2f]">
              Available plans
            </h2>
            <p className="mt-1 text-sm text-[#6d645d]">
              Every subscription unlocks the same premium tools; choose the billing cycle that fits your budget. Payment
              is processed securely through PayMongo (card, GCash, PayMaya, GrabPay where enabled).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-[#7e746b] transition hover:bg-[#f7f3ed] hover:text-[#2f2f2f]"
          >
            <FiX size={20} />
          </button>
        </header>

        <div className="max-h-[calc(min(90vh,720px)-140px)] overflow-y-auto p-5">
          {isPlanSelectionLocked ? (
            <p className="mb-4 rounded-xl border border-[#e9dece] bg-[#fffaeb] px-3 py-2.5 text-xs text-[#6d645d]">
              <span className="font-semibold text-[#92400e]">Plan selection is locked</span> until your current prepaid
              period ends
              {planSelectionLockExpiresAtLabel && planSelectionLockExpiresAtLabel !== '—'
                ? ` (${planSelectionLockExpiresAtLabel}).`
                : '.'}
            </p>
          ) : null}
          <ul className="space-y-4">
            {pricingOptions.map((plan) => (
              <li
                key={plan.id}
                className={`rounded-2xl border p-4 ${
                  plan.highlighted
                    ? 'border-[#d8b79f] bg-[#fff8f1] shadow-sm'
                    : 'border-[#efe7dc] bg-[#fcfaf7]'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#2f2f2f]">{plan.title}</h3>
                      {plan.highlighted && (
                        <span className="rounded-full bg-[#9b5a2c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#7e746b]">{plan.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#efe7dc] pt-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#a19384]">Monthly equivalent</p>
                        <p className="font-semibold text-[#2f2f2f]">{plan.monthlyRate}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#a19384]">Billed as</p>
                        <p className="text-[#6d645d]">{plan.billedAs}</p>
                        <p className="font-semibold text-[#2f2f2f]">{plan.total}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChoosePlan?.(plan)
                    }}
                    disabled={Boolean(processingPlanId) || isPlanSelectionLocked}
                    title={
                      isPlanSelectionLocked
                        ? 'You can choose a new plan after your current prepaid period ends.'
                        : undefined
                    }
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:self-center ${
                      plan.highlighted
                        ? 'bg-[#9b5a2c] text-white hover:bg-[#824b24]'
                        : 'border border-[#e1d4c5] text-[#5f5f5f] hover:bg-[#f7f3ed]'
                    } ${processingPlanId || isPlanSelectionLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {processingPlanId === plan.id ? 'Redirecting…' : 'Select plan'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] px-3 py-2.5 text-xs text-[#6d645d]">
            After checkout, your business can be reviewed for publication. Free accounts stay off the public map until a
            plan is active.
          </p>
        </div>

        <footer className="border-t border-[#f0e8de] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#e7dfd5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] sm:w-auto"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}

export default AvailablePlansModal
