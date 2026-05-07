import { BillingOverviewSection, PricingPlansSection } from '../../../components/business/billing/sections'
import XenditMobileCheckoutModal from '../../../components/business/billing/modals/XenditMobileCheckoutModal'
import { useBusinessBilling } from '../../../hooks/useBusinessBilling.hook'
import { useSubscriptionCatalog } from '../../../hooks/useSubscriptionCatalog.hook'

const Billing = () => {
  const { catalog: subscriptionCatalog, isLoading: isSubscriptionCatalogLoading } = useSubscriptionCatalog()

  const {
    hasActivePlan,
    isPlanSelectionLocked,
    planSubscriptionSummary,
    showPastOrFailedPlan,
    billingAccountSummary,
    monthlyCapacity,
    ledgerPayments,
    ledgerSubscriptions,
    isLedgerLoading,
    displayRows,
    billingAddressFormDefaults,
    isBillingProfileLoading,
    processingPlanId,
    handleChoosePlan,
    handleBillingAddressSave,
    isAvailablePlansModalOpen,
    isCompareFeaturesModalOpen,
    handleOpenAvailablePlansModal,
    handleCloseAvailablePlansModal,
    handleOpenCompareFeaturesModal,
    handleCloseCompareFeaturesModal,
    isXenditMobileCheckoutModalOpen,
    xenditMobileCheckoutUrl,
    closeXenditMobileCheckoutModal,
    continueXenditMobileCheckout
  } = useBusinessBilling()

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Billing</h1>
        <p className="text-sm text-[#6d645d]">Manage your subscription, payment details, and plan options.</p>
        {isSubscriptionCatalogLoading ? (
          <p className="mt-1 text-xs text-[#9f9387]">Loading latest plan options…</p>
        ) : null}
      </div>

      <BillingOverviewSection
        planBenefits={subscriptionCatalog.benefits}
        freeTierSummary={subscriptionCatalog.freeTier}
        featureComparisonColumns={subscriptionCatalog.columns}
        featureComparisonRows={subscriptionCatalog.rows}
        pricingOptions={subscriptionCatalog.pricing}
        hasActivePlan={hasActivePlan}
        isPlanSelectionLocked={isPlanSelectionLocked}
        planSubscriptionSummary={planSubscriptionSummary}
        showPastOrFailedPlan={showPastOrFailedPlan}
        billingAccountSummary={billingAccountSummary}
        monthlyCapacity={monthlyCapacity}
        ledgerPayments={ledgerPayments}
        ledgerSubscriptions={ledgerSubscriptions}
        isLedgerLoading={isLedgerLoading}
        billingDisplayRows={displayRows}
        billingAddressFormDefaults={billingAddressFormDefaults}
        isBillingProfileLoading={isBillingProfileLoading}
        onBillingAddressSave={handleBillingAddressSave}
        onChoosePlan={handleChoosePlan}
        processingPlanId={processingPlanId}
        isAvailablePlansModalOpen={isAvailablePlansModalOpen}
        isCompareFeaturesModalOpen={isCompareFeaturesModalOpen}
        onOpenAvailablePlans={handleOpenAvailablePlansModal}
        onOpenCompareFeatures={handleOpenCompareFeaturesModal}
        onCloseAvailablePlans={handleCloseAvailablePlansModal}
        onCloseCompareFeatures={handleCloseCompareFeaturesModal}
      />
      <PricingPlansSection
        pricingOptions={subscriptionCatalog.pricing}
        onChoosePlan={handleChoosePlan}
        processingPlanId={processingPlanId}
        isPlanSelectionLocked={isPlanSelectionLocked}
        planSelectionLockExpiresAtLabel={planSubscriptionSummary?.expiresAtLabel}
      />

      <XenditMobileCheckoutModal
        isOpen={isXenditMobileCheckoutModalOpen}
        checkoutUrl={xenditMobileCheckoutUrl}
        onClose={closeXenditMobileCheckoutModal}
        onContinueToXendit={continueXenditMobileCheckout}
      />
    </section>
  )
}

export default Billing
