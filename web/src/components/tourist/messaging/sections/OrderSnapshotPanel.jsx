import { FiMapPin, FiPackage } from 'react-icons/fi'
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
  const businessName =
    snapshot.businessName != null ? String(snapshot.businessName).trim() : ''
  const storeImageRaw =
    snapshot.businessStoreImage != null
      ? String(snapshot.businessStoreImage)
      : snapshot.productImage != null
        ? String(snapshot.productImage)
        : ''
  const storeImage = storeImageRaw.trim()
  const descriptionRaw =
    snapshot.businessDescription != null
      ? String(snapshot.businessDescription)
      : snapshot.productDetails != null
        ? String(snapshot.productDetails)
        : ''
  const description = withoutBillingLine(descriptionRaw)
  const businessAddress =
    snapshot.businessAddress != null ? String(snapshot.businessAddress).trim() : ''
  const detailsRaw = snapshot.productDetails != null ? String(snapshot.productDetails) : ''
  const orderDetails = withoutBillingLine(detailsRaw)
  const total = snapshot.total != null ? String(snapshot.total) : ''
  const itemsCount = snapshot.itemsCount
  const rawStatus = snapshot.status != null ? String(snapshot.status) : ''
  const statusLabel = !isInquiry && rawStatus ? touristCustomerOrderStatusLabel(rawStatus, orderType) : ''
  const statusBadgeClass = touristCustomerOrderStatusBadgeClass(rawStatus)
  const storeInitial = (businessName || productName || 'S').trim().slice(0, 1).toUpperCase() || 'S'

  if (isInquiry) {
    const inquiryLabel = productName || 'General inquiry'

    return (
      <aside className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#eadfce] bg-[#f0e8de]">
            {storeImage ? (
              <img
                src={storeImage}
                alt={businessName ? `${businessName} logo` : 'Store'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#9b5a2c]">
                {storeInitial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9f9387]">Inquiry</p>
            <p className="mt-1 font-semibold text-[#1f1f1f]">{businessName || inquiryLabel}</p>
            {businessName ? (
              <p className="mt-0.5 text-xs text-[#6b655d]">{inquiryLabel}</p>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className="mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#faf8f5] p-3 text-sm leading-relaxed text-[#4a433c]">
            {description}
          </p>
        ) : (
          <p className="mt-4 rounded-xl bg-[#faf8f5] p-3 text-sm leading-relaxed text-[#9f9387]">
            No store description yet.
          </p>
        )}

        {businessAddress ? (
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-[#4a433c]">
            <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9b5a2c]" aria-hidden />
            <span>{businessAddress}</span>
          </p>
        ) : null}
      </aside>
    )
  }

  return (
    <aside className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf3ea] text-[#9b5a2c]">
          <FiPackage className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9f9387]">Order in this chat</p>
          <p className="mt-1 font-semibold text-[#1f1f1f]">{productName || 'Menu order'}</p>
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

      {orderDetails ? (
        <pre className="mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#faf8f5] p-3 font-sans text-xs leading-relaxed text-[#4a433c]">
          {orderDetails}
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
