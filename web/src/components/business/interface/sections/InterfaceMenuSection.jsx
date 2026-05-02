const InterfaceMenuSection = ({
  themeColor,
  categoryLabel,
  isEditingLayout,
  hasPendingLayoutChange,
  handleStartLayoutEdit,
  handleSaveLayout,
  handleCancelLayoutEdit,
  savedCardLayout,
  cardLayoutDraft,
  setCardLayoutDraft,
  showCardDetails,
  setShowCardDetails,
  cardListClassName,
  emptyCards,
  getCardClassName
}) => {
  return (
    <section
      className="rounded-2xl border p-6 shadow-sm"
      style={{
        borderColor: `${themeColor}26`,
        backgroundColor: `${themeColor}0d`
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">
            {categoryLabel === 'Restaurant' ? 'Menu Listings' : 'Posted Products'}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#1f1f1f]">
            {categoryLabel === 'Restaurant' ? 'Your Menu Cards' : 'Your Product Cards'}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={!isEditingLayout ? handleStartLayoutEdit : hasPendingLayoutChange ? handleSaveLayout : handleCancelLayoutEdit}
            className="rounded-full px-4 py-2 text-xs font-medium text-white transition"
            style={{
              backgroundColor: !isEditingLayout ? themeColor : hasPendingLayoutChange ? themeColor : '#8c8c8c'
            }}
          >
            {!isEditingLayout ? 'Edit Layout' : hasPendingLayoutChange ? 'Save' : 'Cancel Edit'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#7a736b]">Display:</span>
        <span
          className="rounded-full border px-3 py-1.5 text-xs font-medium"
          style={{
            borderColor: `${themeColor}2b`,
            backgroundColor: `${themeColor}12`,
            color: '#2f2f2f'
          }}
        >
          {savedCardLayout === 'grid' ? 'Grid' : savedCardLayout === 'single-scroll' ? 'Single Scroll' : 'Double Carousel'}
        </span>
        {isEditingLayout && (
          <>
            <button
              type="button"
              onClick={() => setCardLayoutDraft('single-scroll')}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
              style={{
                borderColor: cardLayoutDraft === 'single-scroll' ? `${themeColor}66` : `${themeColor}2b`,
                backgroundColor: cardLayoutDraft === 'single-scroll' ? `${themeColor}1c` : '#ffffff',
                color: '#2f2f2f'
              }}
            >
              Single Scroll
            </button>
            <button
              type="button"
              onClick={() => setCardLayoutDraft('double-carousel')}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
              style={{
                borderColor: cardLayoutDraft === 'double-carousel' ? `${themeColor}66` : `${themeColor}2b`,
                backgroundColor: cardLayoutDraft === 'double-carousel' ? `${themeColor}1c` : '#ffffff',
                color: '#2f2f2f'
              }}
            >
              Double Carousel
            </button>
            <button
              type="button"
              onClick={() => setCardLayoutDraft('grid')}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
              style={{
                borderColor: cardLayoutDraft === 'grid' ? `${themeColor}66` : `${themeColor}2b`,
                backgroundColor: cardLayoutDraft === 'grid' ? `${themeColor}1c` : '#ffffff',
                color: '#2f2f2f'
              }}
            >
              Grid
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowCardDetails((value) => !value)}
          className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
          style={{
            borderColor: `${themeColor}2b`,
            backgroundColor: showCardDetails ? `${themeColor}14` : '#ffffff',
            color: '#2f2f2f'
          }}
        >
          {showCardDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className={cardListClassName}>
        {emptyCards.map((_, index) => (
          <article key={`empty-card-${index}`} className={getCardClassName(index)}>
            <div className="flex h-28 items-center justify-center rounded-lg bg-[#f8f4ee] text-xs text-[#a29688]">
              No image yet
            </div>
            <p className="mt-3 text-sm font-medium text-[#2f2f2f]">
              Empty {categoryLabel === 'Restaurant' ? 'Menu' : 'Product'} Card
            </p>
            {showCardDetails && (
              <p className="mt-1 text-xs text-[#7a736b]">Add details, image, and price to publish this card.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default InterfaceMenuSection
