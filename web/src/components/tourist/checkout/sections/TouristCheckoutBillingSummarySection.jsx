const TouristCheckoutBillingSummarySection = ({
  selectedCount,
  selectedTotal,
  cartItemCount,
  cartTotal,
  billingMethodLabel,
  formatPhp
}) => (
  <section
    className="rounded-2xl border border-[#e7dfd5] bg-[#faf8f5] p-4 shadow-sm md:p-5"
    aria-labelledby="checkout-billing-summary-heading"
  >
    <h2 id="checkout-billing-summary-heading" className="text-base font-semibold text-[#1f1f1f]">
      Payment preview
    </h2>
    <p className="mt-1 text-xs text-[#5b5b5b]">
      Pick how you want to pay (each option opens PayMongo with only that method). The restaurant only receives your
      order after payment succeeds. One restaurant per online checkout.
    </p>
    <dl className="mt-4 grid gap-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece3d9] pb-2">
        <dt className="text-[#5b5b5b]">Items selected for checkout</dt>
        <dd className="font-semibold text-[#1f1f1f]">{selectedCount} unit{selectedCount === 1 ? '' : 's'}</dd>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece3d9] pb-2">
        <dt className="text-[#5b5b5b]">Selected subtotal (estimate)</dt>
        <dd className="text-lg font-semibold text-[#ff7a1a]">{formatPhp(selectedTotal)}</dd>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece3d9] pb-2">
        <dt className="text-[#5b5b5b]">Payment</dt>
        <dd className="font-medium text-[#1f1f1f]">{billingMethodLabel}</dd>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-0.5 text-xs text-[#6b6b6b]">
        <dt>Full cart (all items)</dt>
        <dd>
          {cartItemCount} item row{cartItemCount === 1 ? '' : 's'} · {formatPhp(cartTotal)}
        </dd>
      </div>
    </dl>
  </section>
)

export default TouristCheckoutBillingSummarySection
