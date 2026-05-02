import { FiEye, FiSearch } from 'react-icons/fi'
import { APPROVAL_STATUS, statusLabel, statusTone } from './constants'
import { formatDate, getInitials } from './utils'

const RequestApprovalTable = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  requests,
  onOpenReview
}) => (
  <section className="w-full overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-4 py-4 md:px-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Request List</h2>
        <p className="text-sm text-[#5d554e]">Business verification requests and their current approval status.</p>
      </div>
      <button
        type="button"
        className="rounded-xl border border-[#d8c7b3] bg-[#f7efe5] px-4 py-2 text-sm font-medium text-[#6d4c34] transition hover:bg-[#efdfcf]"
      >
        Export
      </button>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-4 py-3 md:px-6">
      <label className="relative w-full max-w-md">
        <FiSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9d8f80]"
        />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search business, owner, or business ID..."
          className="w-full rounded-xl border border-[#e7dfd5] bg-white py-2 pl-9 pr-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
        />
      </label>

      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value)}
        className="rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
      >
        <option value="ALL">All Status</option>
        <option value={APPROVAL_STATUS.PENDING}>Pending</option>
        <option value={APPROVAL_STATUS.VERIFIED}>Approved</option>
        <option value={APPROVAL_STATUS.REJECTED}>Declined</option>
      </select>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#fcfaf7] text-left text-xs uppercase tracking-wide text-[#9b5a2c]">
          <tr>
            <th className="px-4 py-3 md:px-6">Business</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right md:px-6">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6f655b]">
                Loading approval requests...
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id} className="border-t border-[#f1e8de] text-[#1f1f1f]">
                <td className="px-4 py-3 md:px-6">
                  <div className="flex items-center gap-3">
                    {request.logo ? (
                      <img
                        src={request.logo}
                        alt={`${request.businessName} avatar`}
                        className="h-9 w-9 rounded-full border border-[#e8ded2] object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2e8da] text-xs font-semibold text-[#9b5a2c]">
                        {getInitials(request.businessName)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{request.businessName}</p>
                      <p className="mt-1 text-xs text-[#6f655b]">{request.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{request.ownerName}</td>
                <td className="px-4 py-3">{request.category}</td>
                <td className="px-4 py-3">{formatDate(request.submittedAt)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[request.status]}`}>
                    {statusLabel[request.status] || request.status}
                  </span>
                </td>
                <td className="px-4 py-3 md:px-6">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReview(request)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#e7dfd5] px-3 py-1.5 text-xs font-medium text-[#3f3a35] transition hover:bg-[#f5eee4]"
                    >
                      <FiEye size={13} />
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          {!isLoading && requests.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6f655b]">
                No requests found for your current search and filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="flex items-center justify-between gap-3 border-t border-[#f0e7dd] px-4 py-2 md:px-6">
      <p className="text-xs text-[#7a7066]">Showing 1-10 of {requests.length || 0}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          className="rounded-lg border border-[#e7dfd5] bg-white px-2.5 py-1 text-xs font-medium text-[#9a8f82] disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="rounded-lg border border-[#eadfce] bg-[#f8f3ec] px-2.5 py-1 text-xs font-semibold text-[#6d4c34]">
          1
        </span>
        <button
          type="button"
          disabled
          className="rounded-lg border border-[#e7dfd5] bg-white px-2.5 py-1 text-xs font-medium text-[#9a8f82] disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </section>
)

export default RequestApprovalTable
