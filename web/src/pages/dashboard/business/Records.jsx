import { RecordsFilterSection, RecordsTableSection } from '../../../components/business/records/sections'
import { useBusinessRecords } from '../../../hooks/useBusinessRecords.hook'

const Records = () => {
  const {
    form,
    paginatedOrders,
    filteredCount,
    currentPage,
    totalPages,
    goToPreviousPage,
    goToNextPage
  } = useBusinessRecords()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Order Records</h1>
        <p className="mt-1 text-sm text-[#6d645d]">Track completed customer order outcomes: success or failed.</p>
      </div>

      <div className="rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
        <RecordsFilterSection form={form} />
        <RecordsTableSection orders={paginatedOrders} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0e8de] pt-3">
          <p className="text-xs text-[#8a8179]">Showing {paginatedOrders.length} of {filteredCount} record(s)</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#eadfce] px-3 py-1.5 text-xs font-semibold text-[#6d645d] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-[#7d5b3b]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[#eadfce] px-3 py-1.5 text-xs font-semibold text-[#6d645d] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Records
