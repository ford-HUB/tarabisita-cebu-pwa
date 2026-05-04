import { FiPackage } from 'react-icons/fi'

/**
 * Order context shown above each guest message in the business chat thread.
 * @param {{ snapshot: Record<string, unknown> | null | undefined }} props
 */
const OrderSnippetAboveMessage = ({ snapshot }) => {
  if (!snapshot || typeof snapshot !== 'object') return null

  const orderCode = snapshot.orderCode != null ? String(snapshot.orderCode) : ''
  const productName = snapshot.productName != null ? String(snapshot.productName) : ''
  const productImage = snapshot.productImage != null ? String(snapshot.productImage).trim() : ''
  const total = snapshot.total != null ? String(snapshot.total) : ''
  const status = snapshot.status != null ? String(snapshot.status) : ''
  const itemsCount = snapshot.itemsCount

  return (
    <div className="mb-1.5 w-full min-w-0 rounded-xl border border-[#e7dfd5] bg-[#faf8f5] p-2.5 shadow-sm">
      <div className="flex gap-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#eadfce] bg-white">
          {productImage ? (
            <img src={productImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#c4b5a8]">
              <FiPackage className="h-6 w-6" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-xs font-semibold text-[#1f1f1f]">{productName || 'Order'}</p>
          {orderCode ? <p className="mt-0.5 font-mono text-[10px] text-[#6b5545]">{orderCode}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#6d645d]">
            {itemsCount != null ? (
              <span>
                {itemsCount} item{Number(itemsCount) === 1 ? '' : 's'}
              </span>
            ) : null}
            {total ? <span className="font-medium text-[#1f1f1f]">{total}</span> : null}
            {status ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#9b5a2c] ring-1 ring-[#eadfce]">
                {status}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSnippetAboveMessage
