import { FiSearch } from 'react-icons/fi'
import { PAYMENT_STATUS_FILTER, PERIOD_OPTIONS } from './transactions.constants'

const TransactionsToolbarSection = ({ register, errors }) => {
  const searchError = errors?.search?.message

  return (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-4 py-3 md:px-6">
    <div className="relative w-full max-w-md min-w-[200px]">
      <label className="relative block" htmlFor="admin-transactions-search">
        <FiSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 z-1 -translate-y-1/2 text-[#9d8f80]"
          aria-hidden
        />
        <input
          id="admin-transactions-search"
          type="search"
          {...register('search')}
          placeholder="Search order, business, owner, or email..."
          aria-invalid={searchError ? 'true' : 'false'}
          aria-describedby={searchError ? 'admin-transactions-search-error' : undefined}
          className={`w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] ${
            searchError ? 'border-[#dc2626]' : 'border-[#e7dfd5]'
          }`}
          autoComplete="off"
        />
      </label>
      {searchError ? (
        <p id="admin-transactions-search-error" className="mt-1 text-xs text-[#b42318]" role="alert">
          {searchError}
        </p>
      ) : null}
    </div>

    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
      <select
        {...register('period')}
        className="w-full min-w-[140px] rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] sm:w-auto"
      >
        {PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        {...register('paymentStatus')}
        className="w-full min-w-[140px] rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] sm:w-auto"
      >
        {PAYMENT_STATUS_FILTER.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
  )
}

export default TransactionsToolbarSection
