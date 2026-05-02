import { useWatch } from 'react-hook-form'

const SubscriptionCatalogBenefitsSection = ({ register, control, errors }) => {
  const benefits = useWatch({ control, name: 'benefits' }) || []

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
      <header className="mb-4 border-b border-[#f0e8de] pb-3">
        <h2 className="text-base font-semibold text-[#2f2f2f]">Plan benefits list</h2>
        <p className="mt-1 text-sm text-[#6d645d]">
          Same bullets as <span className="font-medium text-[#2f2f2f]">Plan Benefits</span> on business Billing when a
          plan is active.
        </p>
      </header>
      <ul className="space-y-3">
        {benefits.map((_, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] p-3 sm:flex-row sm:items-center">
            <label className="min-w-0 flex-1 text-xs text-[#6d645d]">
              Label
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-sm" {...register(`benefits.${index}.label`)} />
              {errors.benefits?.[index]?.label && (
                <span className="mt-1 block text-xs text-red-600">{errors.benefits[index].label.message}</span>
              )}
            </label>
            <label className="flex shrink-0 items-center gap-2 text-xs text-[#6d645d] sm:pt-4">
              <input type="checkbox" {...register(`benefits.${index}.included`, { valueAsBoolean: true })} />
              Included for paid tiers
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SubscriptionCatalogBenefitsSection
