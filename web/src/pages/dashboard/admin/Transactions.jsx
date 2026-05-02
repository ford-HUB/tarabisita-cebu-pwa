import { TransactionsPageHeading, TransactionsPanelSection } from '../../../components/ui/admin/transactions'
import { useAdminTransactions } from '../../../hooks/useAdminTransactions.hook'

const Transactions = () => {
  const {
    register,
    errors,
    sortedRows,
    isLoading,
    sortKey,
    sortDir,
    onSort,
    selectedIds,
    toggleRow,
    toggleAllVisible,
    allVisibleSelected,
    exportCsv,
    downloadSummaryPdf,
    visibleCount,
    totalLoaded
  } = useAdminTransactions()

  return (
    <div className="w-full space-y-5">
      <TransactionsPageHeading />

      <TransactionsPanelSection
        onExportCsv={exportCsv}
        isExportDisabled={isLoading || sortedRows.length === 0}
        onDownloadSummaryPdf={downloadSummaryPdf}
        isPdfDisabled={isLoading || sortedRows.length === 0}
        register={register}
        errors={errors}
        isLoading={isLoading}
        sortedRows={sortedRows}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAllVisible={toggleAllVisible}
        allVisibleSelected={allVisibleSelected}
        visibleCount={visibleCount}
        totalLoaded={totalLoaded}
      />
    </div>
  )
}

export default Transactions
