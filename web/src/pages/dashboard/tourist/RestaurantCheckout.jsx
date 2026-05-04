import { useTouristRestaurantCheckout } from '../../../hooks/useTouristRestaurantCheckout.hook.js'
import { touristCartHref } from '../../../components/layout/tourist/touristLayout.constants.js'
import PaymongoMobileCheckoutModal from '../../../components/business/billing/modals/PaymongoMobileCheckoutModal.jsx'
import TouristCheckoutBillingSummarySection from '../../../components/tourist/checkout/sections/TouristCheckoutBillingSummarySection.jsx'
import TouristCheckoutCustomerSection from '../../../components/tourist/checkout/sections/TouristCheckoutCustomerSection.jsx'
import TouristCheckoutOrderReviewSection from '../../../components/tourist/checkout/sections/TouristCheckoutOrderReviewSection.jsx'

const RestaurantCheckout = () => {
  const {
    items,
    groupsForCheckout,
    cartTotal,
    selectedItemRowCount,
    selectedCount,
    selectedTotal,
    billingMethodLabel,
    formatPhp,
    billingPaymentOptions,
    form,
    placeOrders,
    isSubmitting,
    goExplore,
    goCart,
    setItemNotes,
    isPaymongoMobileCheckoutModalOpen,
    paymongoMobileCheckoutUrl,
    closePaymongoMobileCheckoutModal,
    continuePaymongoMobileCheckout
  } = useTouristRestaurantCheckout()

  const {
    register,
    control,
    formState: { errors }
  } = form

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#e7dfd5] bg-white p-8 text-center shadow-sm md:p-10">
        <h1 className="text-lg font-semibold text-[#1f1f1f]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#5b5b5b]">Add items from Explore, then open your cart to continue to checkout.</p>
        <button
          type="button"
          onClick={goExplore}
          className="mt-6 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  if (selectedCount === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#1f1f1f]">Nothing selected for checkout</h1>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Choose at least one item in your cart, then return here to enter payment and contact details.
          </p>
          <button
            type="button"
            onClick={goCart}
            className="mt-5 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
          >
            Go to cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f] md:text-2xl">Checkout</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          Enter your details, then pay securely. Your order is sent to the restaurant only after payment succeeds.
        </p>
      </div>

      <TouristCheckoutOrderReviewSection
        groups={groupsForCheckout}
        formatPhp={formatPhp}
        editCartHref={touristCartHref}
        setItemNotes={setItemNotes}
      />

      <TouristCheckoutBillingSummarySection
        selectedCount={selectedCount}
        selectedTotal={selectedTotal}
        cartItemCount={items.length}
        cartTotal={cartTotal}
        billingMethodLabel={billingMethodLabel}
        formatPhp={formatPhp}
      />

      <TouristCheckoutCustomerSection
        register={register}
        control={control}
        errors={errors}
        billingPaymentOptions={billingPaymentOptions}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-[#efe6dc] bg-[#fbf9f6] p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#1f1f1f]">
          <p>
            <span className="font-medium">Checkout total (selected)</span>{' '}
            <span className="text-lg font-semibold text-[#ff7a1a]">{formatPhp(selectedTotal)}</span>
          </p>
          {selectedItemRowCount < items.length || Math.abs(selectedTotal - cartTotal) > 0.001 ? (
            <p className="mt-0.5 text-xs text-[#5b5b5b]">Full cart: {formatPhp(cartTotal)}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isSubmitting || selectedCount === 0}
          onClick={placeOrders}
          className="rounded-full bg-[#1f1f1f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Starting payment…' : 'Continue to payment'}
        </button>
      </div>

      <p className="text-center text-xs text-[#6b6b6b]">
        Totals use current catalog prices on our server. Online prepayment is one restaurant at a time.
      </p>

      <PaymongoMobileCheckoutModal
        isOpen={isPaymongoMobileCheckoutModalOpen}
        checkoutUrl={paymongoMobileCheckoutUrl}
        onClose={closePaymongoMobileCheckoutModal}
        onContinueToPaymongo={continuePaymongoMobileCheckout}
      />
    </div>
  )
}

export default RestaurantCheckout
