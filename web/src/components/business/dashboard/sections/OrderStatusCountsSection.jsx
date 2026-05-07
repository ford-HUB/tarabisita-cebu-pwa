const StatusCountTile = ({ label, value }) => (
  <article className="rounded-xl border border-[#ece3d9] bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-[#8f867e]">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{Number(value || 0).toLocaleString()}</p>
  </article>
)

const OrderStatusCountsSection = ({ totals }) => (
  <section className="grid gap-4 sm:grid-cols-3">
    <StatusCountTile label="Delivered Orders" value={totals.delivered} />
    <StatusCountTile label="Pending Orders" value={totals.pending} />
    <StatusCountTile label="Canceled Orders" value={totals.canceled} />
  </section>
)

export default OrderStatusCountsSection
