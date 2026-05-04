const OrderBoardHeader = ({ isLoading, isEmpty }) => {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Customer orders</p>
        <h3 className="mt-1 text-lg font-semibold text-[#2f2f2f]">Orders Flow</h3>
        <p className="text-sm text-[#6f665d]">Track newly placed orders, in-progress orders, and completed orders.</p>
        {isLoading && isEmpty ? (
          <p className="mt-2 text-sm text-[#8f8377]">Loading orders…</p>
        ) : null}
      </div>
    </div>
  )
}

export default OrderBoardHeader
