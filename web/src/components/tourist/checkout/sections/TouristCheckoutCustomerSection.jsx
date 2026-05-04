import { Controller } from 'react-hook-form'
import { checkoutPaymentLogos } from '../../../business/profile/ui/index.js'
import PaymentPreferenceMark from '../PaymentPreferenceMark.jsx'

const TouristCheckoutCustomerSection = ({ register, errors, control, billingPaymentOptions }) => (
  <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5" aria-labelledby="checkout-details-heading">
    <h2 id="checkout-details-heading" className="text-base font-semibold text-[#1f1f1f]">
      Details &amp; payment
    </h2>
    <div className="mt-4 grid gap-4">
      <div>
        <label htmlFor="checkout-customer-name" className="text-xs font-semibold uppercase tracking-wide text-[#a79a8b]">
          Your name
        </label>
        <input
          id="checkout-customer-name"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] px-3 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/25"
          {...register('customerName')}
        />
        {errors.customerName ? <p className="mt-1 text-xs text-red-800">{errors.customerName.message}</p> : null}
      </div>
      <div>
        <label htmlFor="checkout-customer-phone" className="text-xs font-semibold uppercase tracking-wide text-[#a79a8b]">
          Phone (optional)
        </label>
        <input
          id="checkout-customer-phone"
          type="tel"
          autoComplete="tel"
          placeholder="09xx xxx xxxx"
          className="mt-1 w-full rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] px-3 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/25"
          {...register('customerPhone')}
        />
        {errors.customerPhone ? <p className="mt-1 text-xs text-red-800">{errors.customerPhone.message}</p> : null}
      </div>

      <fieldset className="min-w-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#a79a8b]">
          Payment
        </legend>
        <Controller
          name="billingType"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-stretch xl:grid-cols-4">
              {billingPaymentOptions.map((opt) => {
                const selected = field.value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`flex h-full min-h-[4.75rem] w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition sm:min-h-[4.5rem] sm:gap-3 sm:px-3 sm:py-3 ${
                      selected
                        ? 'border-[#ff7a1a] bg-[#fff8f2] shadow-sm ring-2 ring-[#ff7a1a]/30'
                        : 'border-[#e7dfd5] bg-[#f8f5f0] hover:border-[#d4c4b6] hover:bg-white'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${opt.iconWrapClass}`}
                      aria-hidden
                    >
                      <PaymentPreferenceMark option={opt} iconSrc={checkoutPaymentLogos[opt.value]} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold leading-tight text-[#1f1f1f]">{opt.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] leading-tight text-[#5b5b5b]">{opt.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.billingType ? <p className="mt-2 text-xs text-red-800">{errors.billingType.message}</p> : null}
      </fieldset>

      <div>
        <label htmlFor="checkout-notes" className="text-xs font-semibold uppercase tracking-wide text-[#a79a8b]">
          Notes for the restaurant (optional)
        </label>
        <textarea
          id="checkout-notes"
          rows={3}
          placeholder="Allergies, pickup time, table number…"
          className="mt-1 w-full resize-y rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] px-3 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/25"
          {...register('notes')}
        />
        {errors.notes ? <p className="mt-1 text-xs text-red-800">{errors.notes.message}</p> : null}
      </div>
    </div>
  </section>
)

export default TouristCheckoutCustomerSection
