import AvailablePlansModal from '../modals/AvailablePlansModal'
import CompareFeaturesModal from '../modals/CompareFeaturesModal'
import { billingLastStatusLabels } from '../constants/billing.constants'
import BillingInfoSection from './BillingInfoSection'
import PaymentHistorySection from './PaymentHistorySection'
import PlanDetailsSection from './PlanDetailsSection'
import SubscriptionLedgerSection from './SubscriptionLedgerSection'

const BillingOverviewSection = ({
  planBenefits,
  freeTierSummary,
  featureComparisonColumns,
  featureComparisonRows,
  pricingOptions,
  hasActivePlan,
  isPlanSelectionLocked = false,
  planSubscriptionSummary = null,
  showPastOrFailedPlan = false,
  billingAccountSummary = null,
  ledgerPayments = [],
  ledgerSubscriptions = [],
  isLedgerLoading = false,
  billingDisplayRows = [],
  billingAddressFormDefaults,
  isBillingProfileLoading = false,
  onBillingAddressSave,
  onChoosePlan,
  processingPlanId = null,
  isAvailablePlansModalOpen,
  isCompareFeaturesModalOpen,
  onOpenAvailablePlans,
  onOpenCompareFeatures,
  onCloseAvailablePlans,
  onCloseCompareFeatures
}) => {
  return (
    <>
      {billingAccountSummary ? (
        <div className="rounded-2xl border border-[#e7dfd5] bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f4b32]">
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Latest billing activity</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-semibold text-[#2f2f2f]">
              {billingLastStatusLabels[billingAccountSummary.lastStatus] || billingAccountSummary.lastStatus}
            </span>
            <span>{billingAccountSummary.lastAmountLabel}</span>
            {billingAccountSummary.lastPaidAtLabel && billingAccountSummary.lastPaidAtLabel !== '—' ? (
              <span className="text-[#6d645d]">Paid {billingAccountSummary.lastPaidAtLabel}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <PlanDetailsSection
          hasActivePlan={hasActivePlan}
          isPlanSelectionLocked={isPlanSelectionLocked}
          planSubscriptionSummary={planSubscriptionSummary}
          showPastOrFailedPlan={showPastOrFailedPlan}
          planBenefits={planBenefits}
          freeTierSummary={freeTierSummary}
          onOpenAvailablePlans={onOpenAvailablePlans}
          onOpenCompareFeatures={onOpenCompareFeatures}
        />
        <BillingInfoSection
          billingDisplayRows={billingDisplayRows}
          billingAddressFormDefaults={billingAddressFormDefaults}
          isBillingProfileLoading={isBillingProfileLoading}
          onBillingAddressSave={onBillingAddressSave}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PaymentHistorySection payments={ledgerPayments} isLoading={isLedgerLoading} />
        <SubscriptionLedgerSection subscriptions={ledgerSubscriptions} isLoading={isLedgerLoading} />
      </div>

      <AvailablePlansModal
        isOpen={isAvailablePlansModalOpen}
        onClose={onCloseAvailablePlans}
        onChoosePlan={onChoosePlan}
        processingPlanId={processingPlanId}
        pricingOptions={pricingOptions}
        isPlanSelectionLocked={isPlanSelectionLocked}
        planSelectionLockExpiresAtLabel={planSubscriptionSummary?.expiresAtLabel}
      />

      <CompareFeaturesModal
        isOpen={isCompareFeaturesModalOpen}
        onClose={onCloseCompareFeatures}
        featureComparisonColumns={featureComparisonColumns}
        featureComparisonRows={featureComparisonRows}
      />
    </>
  )
}

export default BillingOverviewSection
