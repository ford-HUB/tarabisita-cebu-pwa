import { Link } from 'react-router-dom'
import { FiShoppingBag } from 'react-icons/fi'
import {
  buildBusinessOrderDeepLinkHref,
  buildBusinessStoreMessagingThreadHref
} from '../../../layout/business/businessLayout.constants'
import { formatBusinessNotificationTimeAgo } from '../../../../shared/utils/businessNotificationDisplay.utils.js'

/**
 * @param {{
 *   items: Record<string, unknown>[],
 *   isLoading: boolean,
 *   errorMessage: string | null,
 *   variant?: 'dropdown' | 'page',
 *   onItemNavigate?: () => void
 * }} props
 */
const BusinessNotificationCardsSection = ({
  items,
  isLoading,
  errorMessage,
  variant = 'page',
  onItemNavigate
}) => {
  const listClass =
    variant === 'dropdown'
      ? 'max-h-[320px] space-y-3 overflow-y-auto pr-1'
      : 'mx-auto max-w-2xl space-y-3'

  const previewClamp = variant === 'dropdown' ? 'line-clamp-2' : 'line-clamp-3'

  return (
    <>
      {errorMessage ? (
        <p className="rounded-xl border border-[#fecdca] bg-[#fff4f2] px-3 py-2 text-xs text-[#7a271a]">{errorMessage}</p>
      ) : null}

      <div className={listClass}>
        {isLoading && !items.length ? (
          <p className="py-8 text-center text-sm text-[#8a8179]">Loading…</p>
        ) : null}

        {!isLoading && !items.length && !errorMessage ? (
          <div className="rounded-xl border border-dashed border-[#e7dfd5] bg-[#fcfaf7] px-4 py-12 text-center">
            <p className="text-sm font-medium text-[#4a433c]">{"You're all caught up"}</p>
            <p className="mt-1 text-xs text-[#8a8179]">New orders and customer messages will show here.</p>
          </div>
        ) : null}

        {items.map((n) => {
          const isOrder = n.kind === 'ORDER' || Boolean(n.orderId)
          const isReadRow = n.isRead === true || (Number(n.unreadCount) || 0) === 0
          const readCardClass = isReadRow
            ? 'border-[#ebe4dc] bg-[#faf8f5] opacity-[0.92]'
            : 'border-[#f0e7dc] bg-[#fffdfb]'
          const pad = variant === 'page' ? 'px-4 py-4' : 'px-3 py-3'

          if (isOrder) {
            const href = `/${buildBusinessOrderDeepLinkHref(n.orderId)}`
            const img = (n.productImage || '').trim()
            const meta = [n.orderCode, n.productName].filter(Boolean).join(' · ')
            const preview = (n.messagePreview || 'New order').slice(0, variant === 'page' ? 280 : 160)
            return (
              <Link
                key={`order-${n.orderId}`}
                to={href}
                onClick={() => onItemNavigate?.()}
                className={`block rounded-xl border shadow-[0_1px_4px_rgba(88,62,41,0.08)] transition hover:border-[#e0d2c4] hover:bg-white ${readCardClass} ${pad}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] md:h-12 md:w-12">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FiShoppingBag size={variant === 'page' ? 20 : 18} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          isReadRow
                            ? 'rounded-md bg-[#ececec] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#5c5c5c]'
                            : 'rounded-md bg-[#ecfdf3] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#166534]'
                        }
                      >
                        {isReadRow ? 'Order' : 'New order'}
                      </span>
                      <p className="truncate text-sm font-semibold text-[#3f3a35] md:text-base">
                        {n.customerName || 'Customer'}
                      </p>
                    </div>
                    {meta ? <p className="mt-0.5 truncate text-xs text-[#9a8d80] md:text-sm">{meta}</p> : null}
                    <p className={`mt-1 text-[0.95rem] leading-snug text-[#6a5c4e] md:text-base ${previewClamp}`}>
                      {preview}
                    </p>
                    <p className="mt-1 text-xs text-[#9a8d80]">{formatBusinessNotificationTimeAgo(n.previewAt)}</p>
                  </div>
                </div>
              </Link>
            )
          }

          const href = `/${buildBusinessStoreMessagingThreadHref(n.conversationId)}`
          const meta = [n.orderCode, n.productName].filter(Boolean).join(' · ')
          const preview = (n.messagePreview || 'New message').slice(0, variant === 'page' ? 280 : 160)
          const avatarSrc = (n.touristAvatar || '').trim()
          const initial = (n.touristName || 'G').slice(0, 1).toUpperCase()
          return (
            <Link
              key={`msg-${n.conversationId}`}
              to={href}
              onClick={() => onItemNavigate?.()}
              className={`block rounded-xl border shadow-[0_1px_4px_rgba(88,62,41,0.08)] transition hover:border-[#e0d2c4] hover:bg-white ${readCardClass} ${pad}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-[#f0e8de] md:h-12 md:w-12">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#9b5a2c] md:text-sm">
                      {initial}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#3f3a35] md:text-base">{n.touristName || 'Guest'}</p>
                    {n.unreadCount > 1 ? (
                      <span className="shrink-0 rounded-full bg-[#fee4e2] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[#b42318]">
                        {n.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  {meta ? <p className="mt-0.5 truncate text-xs text-[#9a8d80] md:text-sm">{meta}</p> : null}
                  <p className={`mt-1 text-[0.95rem] leading-snug text-[#6a5c4e] md:text-base ${previewClamp}`}>
                    {preview}
                  </p>
                  <p className="mt-1 text-xs text-[#9a8d80]">{formatBusinessNotificationTimeAgo(n.previewAt)}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default BusinessNotificationCardsSection
