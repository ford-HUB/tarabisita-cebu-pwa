import { FiRotateCcw } from 'react-icons/fi'

const formatPrice = (price) =>
  Number(price).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  })

const DeletedItemsModal = ({ isOpen, deletedItems, activeRestoreId, onClose, onRestore }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-3 py-6">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f1e8de] px-5 py-4">
          <h4 className="text-base font-semibold text-[#2f2f2f]">Deleted Menus</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e7dacd] px-3 py-1.5 text-xs font-medium text-[#7d5b3b] transition hover:bg-[#fff7ef]"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {deletedItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#eadfcf] bg-[#fffaf5] p-6 text-center text-sm text-[#8f8377]">
              No deleted menu items.
            </p>
          ) : (
            <div className="space-y-2">
              {deletedItems.map((item) => (
                <div
                  key={`deleted-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#ecdfd1] bg-[#fffdfb] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#2f2f2f]">{item.name}</p>
                    <p className="text-xs text-[#8a7f74]">{formatPrice(item.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(item.id)}
                    disabled={activeRestoreId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#dce7dd] px-3 py-1.5 text-xs font-medium text-[#2b6f47] transition hover:bg-[#eef8f1]"
                  >
                    <FiRotateCcw size={12} />
                    {activeRestoreId === item.id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeletedItemsModal
