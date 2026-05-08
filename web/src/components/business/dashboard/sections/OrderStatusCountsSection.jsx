const StatusCountTile = ({ label, value }) => (
  <article className="rounded-xl border border-[#ece3d9] bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-[#8f867e]">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{Number(value || 0).toLocaleString()}</p>
  </article>
)

const OrderStatusCountsSection = ({
  totals,
  labels = {
    delivered: 'Delivered Orders',
    pending: 'Pending Orders',
    canceled: 'Canceled Orders'
  },
  showWaitingForPayment = false
}) => (
  <section className={`grid gap-4 ${showWaitingForPayment ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
    <StatusCountTile label={labels.delivered} value={totals.delivered} />
    <StatusCountTile label={labels.pending} value={totals.pending} />
    {showWaitingForPayment ? (
      <StatusCountTile label={labels.waitingForPayment || 'Waiting for Payment'} value={totals.waitingForPayment} />
    ) : null}
    <StatusCountTile label={labels.canceled} value={totals.canceled} />
  </section>
)

export default OrderStatusCountsSection
