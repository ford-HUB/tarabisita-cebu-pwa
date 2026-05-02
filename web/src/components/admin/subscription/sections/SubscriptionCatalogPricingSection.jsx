import { useWatch } from 'react-hook-form'

const SubscriptionCatalogPricingSection = ({ register, control, errors }) => {
  const pricing = useWatch({ control, name: 'pricing' }) || []

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
      <header className="mb-4 border-b border-[#f0e8de] pb-3">
        <h2 className="text-base font-semibold text-[#2f2f2f]">Plan pricing & durations</h2>
        <p className="mt-1 text-sm text-[#6d645d]">
          Matches <span className="font-medium text-[#2f2f2f]">Choose a Plan Duration</span> on business Billing.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        {pricing.map((plan, index) => (
          <div
            key={plan?.id || index}
            className={`space-y-3 rounded-2xl border p-4 ${
              plan?.highlighted ? 'border-[#d8b79f] bg-[#fff8f1]' : 'border-[#efe7dc] bg-[#fcfaf7]'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b5a2c]">Plan {index + 1}</p>
            <label className="block text-xs text-[#6d645d]">
              Internal id
              <input
                readOnly
                className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-[#f9fafb] px-2 py-1.5 text-sm"
                {...register(`pricing.${index}.id`)}
              />
            </label>
            <label className="block text-xs text-[#6d645d]">
              Title
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm" {...register(`pricing.${index}.title`)} />
              {errors.pricing?.[index]?.title && (
                <span className="mt-1 block text-xs text-red-600">{errors.pricing[index].title.message}</span>
              )}
            </label>
            <label className="block text-xs text-[#6d645d]">
              Description
              <textarea
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm"
                {...register(`pricing.${index}.description`)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-[#6d645d]">
                Months
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm"
                  {...register(`pricing.${index}.months`, { valueAsNumber: true })}
                />
                {errors.pricing?.[index]?.months && (
                  <span className="mt-1 block text-xs text-red-600">{errors.pricing[index].months.message}</span>
                )}
              </label>
              <label className="block text-xs text-[#6d645d]">
                Total amount (PHP)
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm"
                  {...register(`pricing.${index}.totalAmount`, { valueAsNumber: true })}
                />
                {errors.pricing?.[index]?.totalAmount && (
                  <span className="mt-1 block text-xs text-red-600">{errors.pricing[index].totalAmount.message}</span>
                )}
              </label>
            </div>
            <label className="block text-xs text-[#6d645d]">
              Monthly rate label
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm" {...register(`pricing.${index}.monthlyRate`)} />
            </label>
            <label className="block text-xs text-[#6d645d]">
              Billed as
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm" {...register(`pricing.${index}.billedAs`)} />
            </label>
            <label className="block text-xs text-[#6d645d]">
              Total label
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm" {...register(`pricing.${index}.total`)} />
            </label>
            <label className="flex items-center gap-2 text-xs text-[#6d645d]">
              <input type="checkbox" {...register(`pricing.${index}.highlighted`, { valueAsBoolean: true })} />
              Highlight as popular
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SubscriptionCatalogPricingSection
