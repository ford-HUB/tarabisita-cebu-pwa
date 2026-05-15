import { Link } from 'react-router-dom'
import { FiArrowRight, FiMessageCircle } from 'react-icons/fi'
import {
  buildTouristStoreMessagingThreadHref,
  touristOrdersHref
} from '../../../layout/tourist/touristLayout.constants'

const StoreAvatar = ({ src, label }) => {
  const show = Boolean(src)
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] bg-white shadow-sm">
      {show ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#faf3ea] text-xs font-semibold text-[#9b5a2c]">
          {(label || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )
}

/**
 * @param {{
 *   items: { conversationId: string, businessName: string, businessStoreImage?: string, orderCode?: string, productName?: string }[],
 *   isLoading: boolean,
 *   errorMessage: string | null
 * }} props
 */
const MessagingHubSection = ({ items, isLoading, errorMessage }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-8 shadow-sm">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#f0e8de]" />
        <p className="mt-4 text-center text-sm text-[#5b5b5b]">Loading conversations…</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a]">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-8 shadow-sm md:p-10">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5eee4] text-[#9b5a2c]">
            <FiMessageCircle className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[#1f1f1f]">No chats yet</h2>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Use &ldquo;Inquire&rdquo; on a restaurant or resort listing, or &ldquo;Message store&rdquo; from an order, to start a chat here.
          </p>
          <Link
            to={touristOrdersHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#eb6c12]"
          >
            Go to Orders
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((row) => (
        <li key={row.conversationId}>
          <Link
            to={`/${buildTouristStoreMessagingThreadHref(row.conversationId)}`}
            className="flex items-center gap-4 rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm transition hover:border-[#d4c4b4] hover:bg-[#fffaf6] md:p-5"
          >
            <StoreAvatar src={row.businessStoreImage} label={row.businessName} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1f1f1f]">{row.businessName || 'Store'}</p>
              <p className="mt-0.5 truncate text-sm text-[#5b5b5b]">
                {row.orderCode ? <span className="font-mono text-xs text-[#6b5545]">{row.orderCode}</span> : null}
                {row.orderCode && row.productName ? <span className="text-[#9f9387]"> · </span> : null}
                {row.productName || 'Menu order'}
              </p>
            </div>
            <FiArrowRight className="h-5 w-5 shrink-0 text-[#c4b5a8]" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default MessagingHubSection
