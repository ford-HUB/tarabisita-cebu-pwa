import { FiSearch } from 'react-icons/fi'

const RecordsFilterSection = ({ form }) => {
  const {
    register,
    formState: { errors }
  } = form

  return (
    <div className="border-b border-[#f0e8de] pb-3">
      <div className="grid gap-2 md:grid-cols-[1fr_220px_170px_170px]">
        <label className="relative">
          <FiSearch
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9a8b7c]"
          />
          <input
            type="text"
            {...register('search')}
            placeholder="Search order ID, customer, product, or amount"
            className="w-full rounded-lg border border-[#eadfce] bg-white py-2 pr-3 pl-9 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          />
        </label>

        <select
          {...register('status')}
          className="rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
        >
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>

        <input
          type="date"
          {...register('startDate')}
          className="rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          aria-label="Filter start date"
        />

        <input
          type="date"
          {...register('endDate')}
          className="rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          aria-label="Filter end date"
        />
      </div>

      {errors.endDate?.message ? <p className="mt-2 text-xs text-[#b54747]">{errors.endDate.message}</p> : null}
    </div>
  )
}

export default RecordsFilterSection
