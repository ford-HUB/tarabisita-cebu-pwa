import { useTouristRestaurantCheckout } from '../../../hooks/useTouristRestaurantCheckout.hook.js'
import TouristCheckoutCartSection from '../../../components/tourist/checkout/sections/TouristCheckoutCartSection.jsx'

const RestaurantCart = () => {
  const {
    groups,
    selectedCount,
    formatPhp,
    setItemQty,
    removeItem,
    editCartItem,
    isItemSelected,
    toggleItemSelected,
    goExplore,
    proceedFromCart,
    isProceedingFromCart,
    multiStoreInSavedCart,
    selectedSpansMultipleStores
  } = useTouristRestaurantCheckout({ variant: 'cart' })

  if (!groups.length) {
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
          Items are grouped by restaurant. Online checkout is <span className="font-medium text-[#1f1f1f]">one restaurant at a time</span>
          — select what you want, then use <span className="font-medium text-[#1f1f1f]">Proceed to checkout</span> below.
        </p>
        {multiStoreInSavedCart ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#7a4e12]">
            You have items from more than one partner. Each restaurant is paid and submitted separately; they are not merged into a single order.
          </p>
        ) : null}
      </div>

      <TouristCheckoutCartSection
        groups={groups}
        formatPhp={formatPhp}
        setItemQty={setItemQty}
        removeItem={removeItem}
        onEditItem={editCartItem}
        isItemSelected={isItemSelected}
        toggleItemSelected={toggleItemSelected}
      />

      <div className="space-y-2 border-t border-[#f0e8de] pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goExplore}
            className="w-full rounded-full border border-[#e7dfd5] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f1f1f] transition hover:border-[#d4c4b6] sm:w-auto"
          >
            Continue shopping
          </button>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={() => void proceedFromCart()}
              disabled={isProceedingFromCart || selectedSpansMultipleStores}
              title={
                selectedSpansMultipleStores
                  ? 'Select items from one restaurant only — checkout is one store at a time.'
                  : undefined
              }
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1f1f1f] px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isProceedingFromCart ? 'Loading…' : 'Proceed to checkout'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-[#ece3d9] px-6 py-2.5 text-center text-sm font-semibold text-[#6b6b6b] sm:w-auto"
            >
              Select at least one item
            </button>
          )}
        </div>
        {selectedCount > 0 && selectedSpansMultipleStores ? (
          <p className="text-right text-xs text-[#7a4e12] sm:text-sm">
            You have items from more than one store selected. Uncheck items from other restaurants to continue — checkout is one partner at a time.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default RestaurantCart
