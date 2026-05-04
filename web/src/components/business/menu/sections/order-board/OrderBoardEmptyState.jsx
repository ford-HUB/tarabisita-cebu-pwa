const OrderBoardEmptyState = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#eadfce] bg-[#fffdfb] px-4 py-16 text-center">
      <p className="text-sm font-medium text-[#6f665d]">No orders yet</p>
      <p className="mt-1 max-w-xs text-xs text-[#8f8377]">
        New customer orders will show up in these columns when they arrive.
      </p>
    </div>
  )
}

export default OrderBoardEmptyState
