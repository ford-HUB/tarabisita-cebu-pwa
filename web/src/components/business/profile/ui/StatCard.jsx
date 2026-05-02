const StatCard = ({ label, value, helper }) => (
  <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">{label}</p>
    <p className="mt-2 wrap-break-word text-2xl font-semibold text-[#1f1f1f]">{value}</p>
    <p className="mt-1 wrap-break-word text-sm text-[#5b5b5b]">{helper}</p>
  </article>
)

export default StatCard
