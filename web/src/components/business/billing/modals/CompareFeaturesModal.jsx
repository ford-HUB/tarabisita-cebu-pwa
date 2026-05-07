import { FiCheck, FiMinus, FiX } from 'react-icons/fi'
import {
  featureComparisonColumns as defaultFeatureComparisonColumns,
  featureComparisonRows as defaultFeatureComparisonRows
} from '../constants/billing.constants'

const ICON_CELL_KINDS = new Set(['yes', 'no', 'limited', 'dash'])

const cellIcon = (kind) => {
  if (kind === 'yes') {
    return (
      <span className="inline-flex text-[#12b76a]" aria-label="Included">
        <FiCheck size={18} strokeWidth={2.5} />
      </span>
    )
  }
  if (kind === 'limited') {
    return (
      <span className="text-xs font-medium text-[#b45309]" title="Limited">
        Limited
      </span>
    )
  }
  if (kind === 'dash') {
    return (
      <span className="inline-flex text-[#c4b8a8]" aria-label="Not included">
        <FiMinus size={18} />
      </span>
    )
  }
  return (
    <span className="inline-flex text-[#98a2b3]" aria-label="Not included">
      <FiX size={16} />
    </span>
  )
}

const CompareFeaturesModal = ({
  isOpen,
  onClose,
  featureComparisonColumns = defaultFeatureComparisonColumns,
  featureComparisonRows = defaultFeatureComparisonRows
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-features-modal-title"
        className="max-h-[min(92vh,800px)] w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#f0e8de] px-5 py-4">
          <div>
            <h2 id="compare-features-modal-title" className="text-lg font-semibold text-[#2f2f2f]">
              Compare features
            </h2>
            <p className="mt-1 text-sm text-[#6d645d]">
              Compare paid TaraBisita subscription cycles. Core tools remain consistent, while monthly order capacity
              varies per plan and billing cycle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-[#7e746b] transition hover:bg-[#f7f3ed] hover:text-[#2f2f2f]"
          >
            <FiX size={20} />
          </button>
        </header>

        <div className="max-h-[calc(min(92vh,800px)-130px)] overflow-auto p-5">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 border-b border-[#f0e8de] bg-white py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#a19384]"
                  >
                    Feature
                  </th>
                  {featureComparisonColumns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`border-b border-[#f0e8de] px-2 py-3 text-center ${
                        col.highlighted ? 'bg-[#fff8f1]' : 'bg-white'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-[#2f2f2f]">{col.title}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-[#7e746b]">{col.subtitle}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureComparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-[#f5eee4] last:border-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white py-3 pr-4 text-left font-normal text-[#6d645d]"
                    >
                      {row.label}
                    </th>
                    {featureComparisonColumns.map((col) => {
                      const raw = row.values[col.key]
                      const isIconCell = typeof raw === 'string' && ICON_CELL_KINDS.has(raw)
                      return (
                        <td
                          key={`${row.label}-${col.key}`}
                          className={`px-2 py-3 text-center ${col.highlighted ? 'bg-[#fff8f1]/80' : ''}`}
                        >
                          {isIconCell ? cellIcon(raw) : <span className="text-[#2f2f2f]">{raw}</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-[#9f9387]">
            Limits and tools may be adjusted as the platform evolves; active subscribers are notified of material changes.
          </p>
        </div>

        <footer className="border-t border-[#f0e8de] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#e7dfd5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] sm:w-auto"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}

export default CompareFeaturesModal
