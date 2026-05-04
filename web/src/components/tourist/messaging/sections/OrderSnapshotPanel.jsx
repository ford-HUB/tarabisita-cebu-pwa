import { FiExternalLink, FiMail, FiPackage, FiPhone } from 'react-icons/fi'
import {
  buildMailtoHref,
  buildTelHref,
  buildWebsiteHref,
  buildWhatsAppHref
} from '../../../../shared/utils/touristOrderStoreMessaging.utils.js'

/**
 * @param {{
 *   snapshot: Record<string, unknown> | null,
 *   businessPhone?: string,
 *   businessEmail?: string,
 *   businessWebsite?: string,
 *   businessWhatsapp?: string,
 *   hideReachOutSection?: boolean
 * }} props
 */
const OrderSnapshotPanel = ({
  snapshot,
  businessPhone,
  businessEmail,
  businessWebsite,
  businessWhatsapp,
  hideReachOutSection = false
}) => {
  if (!snapshot || typeof snapshot !== 'object') return null

  const orderCode = snapshot.orderCode != null ? String(snapshot.orderCode) : ''
  const productName = snapshot.productName != null ? String(snapshot.productName) : ''
  const details = snapshot.productDetails != null ? String(snapshot.productDetails) : ''
  const total = snapshot.total != null ? String(snapshot.total) : ''
  const itemsCount = snapshot.itemsCount
  const status = snapshot.status != null ? String(snapshot.status) : ''

  const tel = buildTelHref(businessPhone)
  const mailto = buildMailtoHref({
    email: businessEmail,
    subject: orderCode ? `Order ${orderCode}` : 'Order inquiry',
    body: `Hello,\n\nRegarding order ${orderCode || '—'} (${productName || 'menu order'}).\n\n`
  })
  const site = buildWebsiteHref(businessWebsite)
  const wa = buildWhatsAppHref({
    whatsappRaw: businessWhatsapp,
    phoneRaw: businessPhone,
    prefilledText: `Hi — about order ${orderCode || ''} (${productName || 'menu order'}).`
  })

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
          {status ? (
            <span className="mt-2 inline-block rounded-full bg-[#fff0e3] px-2.5 py-0.5 text-xs font-medium text-[#9b5a2c]">
              {status}
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

      {!hideReachOutSection ? (
        <div className="mt-5 border-t border-[#f0e8de] pt-4">
          <p className="text-xs font-semibold text-[#5b5b5b]">Reach the store</p>
          <div className="mt-2 flex flex-col gap-2">
            {tel ? (
              <a
                href={tel}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] hover:underline"
              >
                <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                Call
              </a>
            ) : null}
            {mailto ? (
              <a
                href={mailto}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] hover:underline"
              >
                <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                Email
              </a>
            ) : null}
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] hover:underline"
              >
                <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </a>
            ) : null}
            {site ? (
              <a
                href={site}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] hover:underline"
              >
                <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                Website
              </a>
            ) : null}
            {!tel && !mailto && !wa && !site ? (
              <p className="text-xs text-[#9f9387]">No extra contact details on file for this store.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export default OrderSnapshotPanel
