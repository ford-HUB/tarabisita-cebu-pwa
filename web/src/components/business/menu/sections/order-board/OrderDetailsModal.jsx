const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl">
        <h4 className="text-base font-semibold text-[#2f2f2f]">{order.productName}</h4>
        <img src={order.productImage} alt={order.productName} className="mt-3 h-44 w-full rounded-lg object-cover" />
        <p className="mt-3 text-sm text-[#5f5f5f]">{order.productDetails}</p>
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#ff7a1a] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#ee6d0f]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal
