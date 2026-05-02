const refineMessage = (fieldError) => {
  if (!fieldError) return ''
  if (typeof fieldError.message === 'string') return fieldError.message
  return ''
}

const SubscriptionCatalogHeaderSection = ({ errors, isSaving, onResetBundled }) => {
  const pricingRefine = refineMessage(errors.pricing)
  const rowsRefine = refineMessage(errors.rows)

  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#9b5a2c]">Manage subscription catalog</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#5f5f5f]">
            Edit plan pricing, benefits, compare-features matrix, and free-tier cards. Businesses load this from the
            API; PayMongo checkout amounts follow the PHP totals here for 3-, 6-, and 12-month plans.
          </p>
          {(pricingRefine || rowsRefine) && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {pricingRefine || rowsRefine}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onResetBundled}
            className="rounded-xl border border-[#e1d4c5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
          >
            Reset form to bundled defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#9b5a2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#824b24] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving…' : 'Save to server'}
          </button>
        </div>
      </div>
      <p className="mt-4 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] px-3 py-2 text-xs text-[#6d645d]">
        Saving updates the live catalog for business Billing and future checkouts. Keep one row each for 3, 6, and 12
        months so checkout stays valid.
      </p>
    </section>
  )
}

export default SubscriptionCatalogHeaderSection
