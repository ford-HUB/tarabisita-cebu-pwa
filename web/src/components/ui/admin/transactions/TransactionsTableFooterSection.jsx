const TransactionsTableFooterSection = ({ visibleCount, totalLoaded }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7dd] px-4 py-3 md:px-6">
    <p className="text-xs text-[#7a7066]">
      Showing {visibleCount} of {totalLoaded} loaded in this date range
    </p>
    <p className="text-xs text-[#a79a8b]">Server returns up to 500 most recent rows per request.</p>
  </div>
)

export default TransactionsTableFooterSection
