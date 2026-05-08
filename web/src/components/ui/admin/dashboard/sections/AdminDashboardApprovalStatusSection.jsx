const statusColorClass = (key) => {
  if (key === 'VERIFIED') return 'bg-[#dcfce7] text-[#166534]'
  if (key === 'PENDING') return 'bg-[#fef3c7] text-[#92400e]'
  if (key === 'REJECTED') return 'bg-[#fee2e2] text-[#991b1b]'
  return 'bg-[#f3f4f6] text-[#374151]'
}

const AdminDashboardApprovalStatusSection = ({ rows }) => (
  <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold text-[#1f1f1f]">Verification status</h2>
    <p className="mt-1 text-sm text-[#7a7169]">Distribution of business approval queue records.</p>

    <div className="mt-5 space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#ece3d9] bg-[#fcfaf7] px-3 py-4 text-sm text-[#7a7169]">
          No approval records available.
        </p>
      ) : (
        rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-xl border border-[#f1e8de] px-3 py-2.5">
            <span className="text-sm text-[#3e3a36]">{row.label}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColorClass(row.key)}`}>
              {row.count.toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  </article>
)

export default AdminDashboardApprovalStatusSection
