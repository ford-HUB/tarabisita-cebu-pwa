import { useTouristRestaurantCheckout } from '../../../hooks/useTouristRestaurantCheckout.hook.js'
import TouristCheckoutCartSection from '../../../components/tourist/checkout/sections/TouristCheckoutCartSection.jsx'

const RestaurantCart = () => {
  const {
    groups,
    selectedCount,
    formatPhp,
    setItemQty,
    removeItem,
    isItemSelected,
    toggleItemSelected,
    goExplore,
    proceedFromCart,
    startCheckoutForBusinessId,
    isProceedingFromCart,
    multiStoreInSavedCart
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
          — use the checkout button under each store.
        </p>
        {multiStoreInSavedCart ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#7a4e12]">
            You have items from more than one partner. Each restaurant is paid and submitted separately; they are not merged into a single order.
          </p>
        ) : null}
      </div>

      {multiStoreInSavedCart ? (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={String(g.businessId)} className="space-y-3">
              <TouristCheckoutCartSection
                groups={[g]}
                formatPhp={formatPhp}
                setItemQty={setItemQty}
                removeItem={removeItem}
                isItemSelected={isItemSelected}
                toggleItemSelected={toggleItemSelected}
              />
              <button
                type="button"
                onClick={() => startCheckoutForBusinessId(g.businessId)}
                className="w-full rounded-full bg-[#1f1f1f] px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black sm:w-auto"
              >
                Check out · {g.businessName}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <TouristCheckoutCartSection
          groups={groups}
          formatPhp={formatPhp}
          setItemQty={setItemQty}
          removeItem={removeItem}
          isItemSelected={isItemSelected}
          toggleItemSelected={toggleItemSelected}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={goExplore}
          className="rounded-full border border-[#e7dfd5] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f1f1f] transition hover:border-[#d4c4b6]"
        >
          Continue shopping
        </button>
        {!multiStoreInSavedCart && selectedCount > 0 ? (
          <button
            type="button"
            onClick={() => void proceedFromCart()}
            disabled={isProceedingFromCart}
            className="inline-flex items-center justify-center rounded-full bg-[#1f1f1f] px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProceedingFromCart ? 'Loading…' : 'Proceed to checkout'}
          </button>
        ) : null}
        {!multiStoreInSavedCart && selectedCount === 0 ? (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-[#ece3d9] px-6 py-2.5 text-center text-sm font-semibold text-[#6b6b6b]">
            Select at least one item
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default RestaurantCart
