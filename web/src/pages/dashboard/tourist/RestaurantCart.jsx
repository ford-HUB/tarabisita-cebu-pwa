import { useTouristRestaurantCheckout } from '../../../hooks/useTouristRestaurantCheckout.hook.js'
import TouristCheckoutCartSection from '../../../components/tourist/checkout/sections/TouristCheckoutCartSection.jsx'

const RestaurantCart = () => {
  const {
    items,
    groups,
    selectedCount,
    formatPhp,
    setItemQty,
    removeItem,
    isItemSelected,
    toggleItemSelected,
    goExplore,
    proceedFromCart,
    isProceedingFromCart
  } = useTouristRestaurantCheckout()

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#e7dfd5] bg-white p-8 text-center shadow-sm md:p-10">
        <h1 className="text-lg font-semibold text-[#1f1f1f]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#5b5b5b]">Browse Explore and add offers from verified partners.</p>
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f] md:text-2xl">Cart</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          Choose items and quantities. You can mix different stores. When you are ready, continue to checkout for
          payment and contact details.
        </p>
      </div>

      <TouristCheckoutCartSection
        groups={groups}
        formatPhp={formatPhp}
        setItemQty={setItemQty}
        removeItem={removeItem}
        isItemSelected={isItemSelected}
        toggleItemSelected={toggleItemSelected}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={goExplore}
          className="rounded-full border border-[#e7dfd5] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f1f1f] transition hover:border-[#d4c4b6]"
        >
          Continue shopping
        </button>
        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={() => void proceedFromCart()}
            disabled={isProceedingFromCart}
            className="inline-flex items-center justify-center rounded-full bg-[#1f1f1f] px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProceedingFromCart ? 'Loading…' : 'Proceed to checkout'}
          </button>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-[#ece3d9] px-6 py-2.5 text-center text-sm font-semibold text-[#6b6b6b]">
            Select at least one item
          </span>
        )}
      </div>
    </div>
  )
}

export default RestaurantCart
