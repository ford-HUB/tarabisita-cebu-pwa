const InfoRow = ({ label, value }) => (
  <div className="rounded-lg border border-[#ece3d9] bg-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-[#9b5a2c]">{label}</p>
    <p className="mt-1 text-sm text-[#1f1f1f]">{value || '-'}</p>
  </div>
)

export default InfoRow
