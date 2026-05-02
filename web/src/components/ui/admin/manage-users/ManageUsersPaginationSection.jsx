import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const ManageUsersPaginationSection = ({
  isLoading,
  page,
  limit,
  total,
  totalPages,
  onPrev,
  onNext
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7dd] px-4 py-3 md:px-6">
        <p className="text-xs text-[#7d736a]">Loading…</p>
      </div>
    )
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const canPrev = page > 1
  const canNext = totalPages > 0 && page < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7dd] px-4 py-3 md:px-6">
      <p className="text-xs text-[#7d736a]">
        {total === 0 ? (
          'No users to show'
        ) : (
          <>
            Showing <span className="font-medium text-[#5f5f5f]">{from}</span>–
            <span className="font-medium text-[#5f5f5f]">{to}</span> of{' '}
            <span className="font-medium text-[#5f5f5f]">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#7d736a]">
          Page <span className="font-medium text-[#5f5f5f]">{totalPages === 0 ? 0 : page}</span> of{' '}
          <span className="font-medium text-[#5f5f5f]">{totalPages}</span>
        </span>
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-lg border border-[#e7dfd5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2f2f2f] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} aria-hidden />
          Prev
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-lg border border-[#e7dfd5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2f2f2f] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          Next
          <FiChevronRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default ManageUsersPaginationSection
