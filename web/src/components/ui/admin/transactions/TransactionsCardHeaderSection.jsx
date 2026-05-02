import { FiDownload, FiFile } from 'react-icons/fi'

const TransactionsCardHeaderSection = ({
  onExportCsv,
  isExportDisabled,
  onDownloadSummaryPdf,
  isPdfDisabled
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e7dd] px-4 py-4 md:px-6">
    <div>
      <h2 className="text-lg font-semibold text-[#1f1f1f]">Plan subscription transactions</h2>
      <p className="mt-1 text-sm text-[#5d554e]">
        Checkout and billing records for businesses on TaraBisita subscription plans.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onDownloadSummaryPdf}
        disabled={isPdfDisabled}
        className="inline-flex items-center gap-2 rounded-xl border border-[#d8c7b3] bg-white px-4 py-2 text-sm font-medium text-[#6d4c34] transition hover:bg-[#f7efe5] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiFile size={16} className="shrink-0" aria-hidden />
        Download PDF summary
      </button>
      <button
        type="button"
        onClick={onExportCsv}
        disabled={isExportDisabled}
        className="inline-flex items-center gap-2 rounded-xl border border-[#d8c7b3] bg-[#f7efe5] px-4 py-2 text-sm font-medium text-[#6d4c34] transition hover:bg-[#efdfcf] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiDownload size={16} className="shrink-0" aria-hidden />
        Export CSV
      </button>
    </div>
  </div>
)

export default TransactionsCardHeaderSection
