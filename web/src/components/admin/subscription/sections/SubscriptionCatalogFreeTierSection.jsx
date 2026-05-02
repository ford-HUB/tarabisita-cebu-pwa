import { useWatch } from 'react-hook-form'

const SubscriptionCatalogFreeTierSection = ({ register, control }) => {
  const freeTier = useWatch({ control, name: 'freeTier' }) || []

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
      <header className="mb-4 border-b border-[#f0e8de] pb-3">
        <h2 className="text-base font-semibold text-[#2f2f2f]">Free tier summary cards</h2>
        <p className="mt-1 text-sm text-[#6d645d]">
          Shown when there is <span className="font-medium text-[#2f2f2f]">no active plan</span> on business Billing.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {freeTier.map((_, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] p-3">
            <label className="block text-xs text-[#6d645d]">
              Card title
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-sm" {...register(`freeTier.${index}.0`)} />
            </label>
            <label className="block text-xs text-[#6d645d]">
              Value
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-sm" {...register(`freeTier.${index}.1`)} />
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SubscriptionCatalogFreeTierSection
