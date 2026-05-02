import { useAdminSubscriptionCatalog } from '../../../hooks/useAdminSubscriptionCatalog.hook'
import {
  SubscriptionCatalogBenefitsSection,
  SubscriptionCatalogFeatureMatrixSection,
  SubscriptionCatalogFreeTierSection,
  SubscriptionCatalogHeaderSection,
  SubscriptionCatalogPricingSection
} from '../../../components/admin/subscription/sections'

const Subscription = () => {
  const { register, control, errors, onSubmit, resetToBundledDefaults, isPageLoading, isSaving } =
    useAdminSubscriptionCatalog()

  if (isPageLoading) {
    return (
      <section className="rounded-2xl border border-[#ece3d9] bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#9b5a2c]">Manage subscription catalog</h1>
        <p className="mt-3 text-sm text-[#6d645d]">Loading catalog from the server…</p>
      </section>
    )
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <SubscriptionCatalogHeaderSection errors={errors} isSaving={isSaving} onResetBundled={resetToBundledDefaults} />
      <SubscriptionCatalogPricingSection register={register} control={control} errors={errors} />
      <SubscriptionCatalogBenefitsSection register={register} control={control} errors={errors} />
      <SubscriptionCatalogFeatureMatrixSection register={register} control={control} errors={errors} />
      <SubscriptionCatalogFreeTierSection register={register} control={control} />
    </form>
  )
}

export default Subscription
