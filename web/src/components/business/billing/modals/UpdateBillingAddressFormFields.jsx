import { billingAddressFieldConfig } from '../constants/billing.constants'

const inputClassName =
  'w-full rounded-xl border border-[#e7dfd5] bg-white px-3 py-2.5 text-sm text-[#2f2f2f] outline-none transition placeholder:text-[#b5a99a] focus:border-[#9b5a2c] focus:ring-1 focus:ring-[#9b5a2c]/20'

const UpdateBillingAddressFormFields = ({ register, errors }) => {
  return (
    <div className="mt-5 space-y-3.5">
      {billingAddressFieldConfig.map(({ name, label }) => (
        <label key={name} className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#7e746b]">{label}</span>
          <input
            type="text"
            autoComplete="off"
            {...register(name)}
            className={inputClassName}
          />
          {errors[name] && <p className="text-xs text-[#b42318]">{errors[name].message}</p>}
        </label>
      ))}
    </div>
  )
}

export default UpdateBillingAddressFormFields
