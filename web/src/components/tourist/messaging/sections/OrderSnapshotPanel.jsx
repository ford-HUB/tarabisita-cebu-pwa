import { FiPackage } from 'react-icons/fi'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../../../../shared/utils/touristOrderDisplay.utils.js'

/** Drop internal `Billing: …` line from order detail blocks (still stored on the order). */
const withoutBillingLine = (text) => {
  const raw = String(text || '')
  const lines = raw.split(/\r?\n/)
  const kept = lines.filter((line) => !/^\s*Billing:\s*/i.test(line))
  return kept.join('\n').trim()
}

/**
 * @param {{ snapshot: Record<string, unknown> | null }} props
 */
const OrderSnapshotPanel = ({ snapshot }) => {
  if (!snapshot || typeof snapshot !== 'object') return null

  const orderType = snapshot.orderType != null ? String(snapshot.orderType) : ''
  const isInquiry = orderType === 'INQUIRY'
  const orderCode = snapshot.orderCode != null ? String(snapshot.orderCode) : ''
  const productName = snapshot.productName != null ? String(snapshot.productName) : ''
  const detailsRaw = snapshot.productDetails != null ? String(snapshot.productDetails) : ''
  const details = withoutBillingLine(detailsRaw)
  const total = snapshot.total != null ? String(snapshot.total) : ''
  const itemsCount = snapshot.itemsCount
  const rawStatus = snapshot.status != null ? String(snapshot.status) : ''
  const statusLabel = !isInquiry && rawStatus ? touristCustomerOrderStatusLabel(rawStatus, orderType) : ''
  const statusBadgeClass = touristCustomerOrderStatusBadgeClass(rawStatus)

  return (
    <aside className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf3ea] text-[#9b5a2c]">
          <FiPackage className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9f9387]">
            {isInquiry ? 'Inquiry' : 'Order in this chat'}
          </p>
          <p className="mt-1 font-semibold text-[#1f1f1f]">{productName || (isInquiry ? 'General inquiry' : 'Menu order')}</p>
          {orderCode ? <p className="mt-0.5 font-mono text-xs text-[#6b5545]">{orderCode}</p> : null}
          {statusLabel ? (
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass}`}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
      </div>

      {details ? (
        <pre className="mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#faf8f5] p-3 font-sans text-xs leading-relaxed text-[#4a433c]">
          {details}
        </pre>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#6b655d]">
        {itemsCount != null ? (
          <span>
            {itemsCount} item{Number(itemsCount) === 1 ? '' : 's'}
          </span>
        ) : null}
        {total ? <span className="font-medium text-[#1f1f1f]">{total}</span> : null}
      </div>
    </aside>
  )
}

export default OrderSnapshotPanel
