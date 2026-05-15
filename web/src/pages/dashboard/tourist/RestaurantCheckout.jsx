import { Link } from 'react-router-dom'
import { useTouristRestaurantCheckout } from '../../../hooks/useTouristRestaurantCheckout.hook.js'
import { touristCartHref } from '../../../components/layout/tourist/touristLayout.constants.js'
import XenditMobileCheckoutModal from '../../../components/business/billing/modals/XenditMobileCheckoutModal.jsx'
import TouristCheckoutBillingSummarySection from '../../../components/tourist/checkout/sections/TouristCheckoutBillingSummarySection.jsx'
import TouristCheckoutCustomerSection from '../../../components/tourist/checkout/sections/TouristCheckoutCustomerSection.jsx'
import TouristCheckoutOrderReviewSection from '../../../components/tourist/checkout/sections/TouristCheckoutOrderReviewSection.jsx'

const RestaurantCheckout = () => {
  const {
    items,
    storeItems,
    groupsForCheckout,
    cartTotal,
    fullStoreCartTotal,
    selectedItemRowCount,
    selectedCount,
    selectedTotal,
    billingMethodLabel,
    formatPhp,
    billingPaymentOptions,
    hasAvailablePaymentOptions,
    form,
    placeOrders,
    isSubmitting,
    goExplore,
    goCart,
    setItemNotes,
    checkoutBlockedMultiStore,
    otherStoresSummary,
    isXenditMobileCheckoutModalOpen,
    xenditMobileCheckoutUrl,
    closeXenditMobileCheckoutModal,
    continueXenditMobileCheckout
  } = useTouristRestaurantCheckout({ variant: 'checkout' })

  const {
    register,
    control,
    formState: { errors }
  } = form

  if (checkoutBlockedMultiStore && storeItems.length > 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#1f1f1f]">Choose one restaurant</h1>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Your saved cart has items from more than one restaurant. Open your cart, select items from one partner, then tap{' '}
            <span className="font-medium">Proceed to checkout</span>.
          </p>
          <Link
            to={touristCartHref}
            className="mt-5 inline-flex rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
          >
            Open cart
          </Link>
        </div>
      </div>
    )
  }

  if (!storeItems.length) {
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

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <div className="rounded-2xl border border-[#e7dfd5] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#1f1f1f]">Nothing to check out for this restaurant</h1>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            This checkout session is tied to one store, but there are no lines for it in your cart. Open your cart to
            add items or pick another restaurant.
          </p>
          <Link
            to={touristCartHref}
            className="mt-5 inline-flex rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
          >
            Open cart
          </Link>
        </div>
      </div>
    )
  }

  if (selectedCount === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#1f1f1f]">Nothing selected for checkout</h1>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Choose at least one item for this restaurant, then return here to enter payment and contact details.
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

  const savedAside =
    otherStoresSummary.rowCount > 0 ? (
      <>
        Other restaurants still in your cart: {otherStoresSummary.rowCount} line
        {otherStoresSummary.rowCount === 1 ? '' : 's'} · {formatPhp(otherStoresSummary.total)}.{' '}
        <Link to={touristCartHref} className="font-semibold text-[#9b5a2c] underline underline-offset-2">
          Manage in cart
        </Link>
      </>
    ) : null

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f] md:text-2xl">Checkout</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          Enter your details, then pay securely. Only the restaurant shown below receives this order after payment
          succeeds.
        </p>
      </div>

      <TouristCheckoutOrderReviewSection
        groups={groupsForCheckout}
        formatPhp={formatPhp}
        setItemNotes={setItemNotes}
      />

      <TouristCheckoutBillingSummarySection
        selectedCount={selectedCount}
        selectedTotal={selectedTotal}
        cartItemCount={items.length}
        cartTotal={cartTotal}
        billingMethodLabel={billingMethodLabel}
        formatPhp={formatPhp}
        fullCartRowLabel="This restaurant (all lines)"
        savedCartAside={savedAside}
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
            <p className="mt-0.5 text-xs text-[#5b5b5b]">This store&apos;s cart: {formatPhp(cartTotal)}</p>
          ) : null}
          {otherStoresSummary.rowCount > 0 ? (
            <p className="mt-0.5 text-xs text-[#5b5b5b]">
              All saved items across Tara Bisita: {formatPhp(fullStoreCartTotal)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isSubmitting || selectedCount === 0 || !hasAvailablePaymentOptions}
          onClick={placeOrders}
          className="rounded-full bg-[#1f1f1f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Starting payment…' : 'Continue to payment'}
        </button>
      </div>

      {!hasAvailablePaymentOptions ? (
        <p className="rounded-xl border border-[#f0dcc7] bg-[#fff9f3] px-3 py-2 text-center text-xs text-[#7a624e]">
          This business has no online payment methods enabled right now.
        </p>
      ) : null}

      <p className="text-center text-xs text-[#6b6b6b]">
        Totals use current catalog prices on our server. One restaurant per online checkout — other saved items stay
        in your cart.
      </p>

      <XenditMobileCheckoutModal
        isOpen={isXenditMobileCheckoutModalOpen}
        checkoutUrl={xenditMobileCheckoutUrl}
        onClose={closeXenditMobileCheckoutModal}
        onContinueToXendit={continueXenditMobileCheckout}
      />
    </div>
  )
}

export default RestaurantCheckout
