import { FiSearch } from 'react-icons/fi'
import { useAdminBusinessPartners } from '../../../hooks/useAdminBusinessPartners.hook'
import { formatDate, getInitials } from '../../../components/ui/admin/request-approval/utils'

const statusBadgeClass = (effectiveStatus) => {
  if (effectiveStatus === 'ACTIVE') {
    return 'bg-[#dcfce7] text-[#166534]'
  }
  if (effectiveStatus === 'EXPIRED') {
    return 'bg-[#fef3c7] text-[#92400e]'
  }
  return 'bg-[#f3f4f6] text-[#4b5563]'
}

const planLabel = (planId, months) => {
  if (!planId && (months == null || months === '')) return '—'
  const m = months != null && months !== '' ? `${months} mo` : ''
  return [String(planId), m].filter(Boolean).join(' · ')
}

const Business = () => {
  const {
    isLoading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    planFilterOptions,
    filteredRows
  } = useAdminBusinessPartners()

  return (
    <div className="w-full space-y-5">
      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#1f1f1f]">Business partners</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5f5f5f]">
          Every business that has started a paid Tara Bisita plan appears here, including accounts whose
          current period has ended. Once a business has subscribed at least once, they remain listed as a
          partner for your records.
        </p>
      </section>

      <section className="w-full overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Partner directory</h2>
            <p className="text-sm text-[#5d554e]">
              Filter by current plan state or search by business, owner, or account id.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-4 py-3 md:px-6">
          <label className="relative w-full max-w-md">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9d8f80]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, owner, email, or id…"
              className="w-full rounded-xl border border-[#e7dfd5] bg-white py-2 pl-9 pr-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            className="rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
          >
            <option value={planFilterOptions.ALL}>All partners</option>
            <option value={planFilterOptions.ACTIVE}>Active plan</option>
            <option value={planFilterOptions.EXPIRED}>Expired plan</option>
            <option value={planFilterOptions.INACTIVE}>No active plan</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#fcfaf7] text-left text-xs uppercase tracking-wide text-[#9b5a2c]">
              <tr>
                <th className="px-4 py-3 md:px-6">Business</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">First partnered</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Plan status</th>
                <th className="px-4 py-3 md:px-6">Verification</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6f655b]">
                    Loading business partners…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6f655b]">
                    No partners match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#f1e8de] text-[#1f1f1f]">
                    <td className="px-4 py-3 md:px-6">
                      <div className="flex items-center gap-3">
                        {row.logo ? (
                          <img
                            src={row.logo}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-[#ece3d9] object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f2e8da] text-xs font-semibold text-[#9b5a2c]">
                            {getInitials(row.name)}
                          </span>
                        )}
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-[#7d7164]">{row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p>{row.ownerName}</p>
                      <p className="text-xs text-[#7d7164]">{row.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[#4f4f4f]">{row.category}</td>
                    <td className="px-4 py-3 text-[#4f4f4f]">{formatDate(row.firstPartneredAt)}</td>
                    <td className="px-4 py-3 text-[#4f4f4f]">{planLabel(row.planId, row.planMonths)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.effectiveStatus)}`}
                      >
                        {row.effectiveStatus === 'INACTIVE' ? 'No active plan' : row.effectiveStatus}
                      </span>
                      {row.expiresAt && row.effectiveStatus === 'ACTIVE' ? (
                        <p className="mt-1 text-xs text-[#7d7164]">Until {formatDate(row.expiresAt)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#4f4f4f] md:px-6">{row.verificationStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Business
