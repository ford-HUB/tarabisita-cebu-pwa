import TransactionsCardHeaderSection from '../TransactionsCardHeaderSection'
import TransactionsPaymentReviewModal from '../TransactionsPaymentReviewModal'
import TransactionsTableFooterSection from '../TransactionsTableFooterSection'
import TransactionsTableSection from '../TransactionsTableSection'
import TransactionsToolbarSection from '../TransactionsToolbarSection'

/**
 * Main card for admin plan-subscription transactions (filters + table).
 * Composed like business Profile sections: page stays thin, layout lives here.
 */
const TransactionsPanelSection = ({
  onExportCsv,
  isExportDisabled,
  onDownloadSummaryPdf,
  isPdfDisabled,
  register,
  errors,
  isLoading,
  sortedRows,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAllVisible,
  allVisibleSelected,
  visibleCount,
  totalLoaded,
  onOpenPaymentReview
}) => (
  <section className="w-full overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
    <TransactionsCardHeaderSection
      onExportCsv={onExportCsv}
      isExportDisabled={isExportDisabled}
      onDownloadSummaryPdf={onDownloadSummaryPdf}
      isPdfDisabled={isPdfDisabled}
    />
    <TransactionsToolbarSection register={register} errors={errors} />
    <TransactionsTableSection
      isLoading={isLoading}
      rows={sortedRows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      selectedIds={selectedIds}
      onToggleRow={onToggleRow}
      onToggleAllVisible={onToggleAllVisible}
      allVisibleSelected={allVisibleSelected}
      onOpenPaymentReview={onOpenPaymentReview}
    />
    <TransactionsTableFooterSection visibleCount={visibleCount} totalLoaded={totalLoaded} />
    <TransactionsPaymentReviewModal />
  </section>
)

export default TransactionsPanelSection
