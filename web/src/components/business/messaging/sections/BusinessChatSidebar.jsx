import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiMessageCircle, FiMoreVertical, FiSearch } from 'react-icons/fi'
import {
  buildBusinessStoreMessagingThreadHref,
  businessOrdersHref
} from '../../../layout/business/businessLayout.constants'

const GuestAvatar = ({ src, label, selected }) => {
  const show = Boolean(src)
  return (
    <div
      className={`relative h-11 w-11 shrink-0 rounded-full shadow-sm ${
        selected ? 'z-[1] ring-2 ring-[#2563eb]/35' : ''
      }`}
    >
      <div
        className={`h-full w-full overflow-hidden rounded-full border bg-white ${
          selected ? 'border-[#2563eb]' : 'border-[#eadfce]'
        }`}
      >
        {show ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f0e8de] text-xs font-semibold text-[#9b5a2c]">
            {(label || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * @param {{
 *   items: { conversationId: string, touristName: string, touristAvatar?: string, orderCode?: string, productName?: string, lastMessageAt?: string, unreadFromCustomerCount?: number }[],
 *   selectedConversationId: string | null,
 *   isLoading: boolean,
 *   errorMessage: string | null,
 *   isResortBusiness?: boolean
 * }} props
 */
const BusinessChatSidebar = ({
  items,
  selectedConversationId,
  isLoading,
  errorMessage,
  isResortBusiness = false
}) => {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((row) => {
      const name = (row.touristName || '').toLowerCase()
      const code = (row.orderCode || '').toLowerCase()
      const product = (row.productName || '').toLowerCase()
      return name.includes(s) || code.includes(s) || product.includes(s)
    })
  }, [items, q])

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-[#f0e8de] px-4 py-3">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">Chats</h2>
        <button
          type="button"
          className="rounded-lg p-1.5 text-[#6d645d] transition hover:bg-[#f7f3ed]"
          aria-label="More options"
        >
          <FiMoreVertical size={18} />
        </button>
      </div>

      <div className="shrink-0 px-3 pb-3 pt-2">
        <label className="flex items-center gap-2 rounded-xl border border-[#e7dfd5] bg-[#fcfaf7] px-3 py-2">
          <FiSearch size={16} className="shrink-0 text-[#918579]" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full min-w-0 bg-transparent text-sm text-[#3f3a35] outline-none placeholder:text-[#a79a8b]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="px-2 py-8 text-center text-sm text-[#5b5b5b]">Loading chats…</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="mx-2 rounded-xl border border-[#fecdca] bg-[#fff4f2] p-4 text-xs text-[#7a271a]">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage && !items.length ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee4] text-[#9b5a2c]">
              <FiMessageCircle className="h-7 w-7" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-medium text-[#1f1f1f]">No customer chats yet</p>
            <p className="mt-2 text-xs text-[#5b5b5b]">
              When a guest uses Inquire on your listing or messages from an order, it will show up here.
            </p>
            <Link
              to={businessOrdersHref}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#9b5a2c] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#824b24]"
            >
              Go to Orders
              <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        {!isLoading && !errorMessage && items.length > 0 && !filtered.length ? (
          <p className="px-3 py-6 text-center text-sm text-[#8a8179]">No matches for your search.</p>
        ) : null}

        <ul className="space-y-0.5">
          {filtered.map((row) => {
            const selected = selectedConversationId === row.conversationId
            const href = `/${buildBusinessStoreMessagingThreadHref(row.conversationId)}`
            const timeLabel = row.lastMessageAt ? formatSidebarTime(row.lastMessageAt) : ''
            const boldGuestName =
              isResortBusiness &&
              !selected &&
              (Number(row.unreadFromCustomerCount) || 0) > 0
            return (
              <li key={row.conversationId}>
                <Link
                  to={href}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                    selected ? 'bg-[#eff6ff]' : 'hover:bg-[#f7f3ed]'
                  }`}
                >
                  <GuestAvatar src={row.touristAvatar} label={row.touristName} selected={selected} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm text-[#2f2f2f] ${boldGuestName ? 'font-bold' : 'font-semibold'}`}
                    >
                      {row.touristName || 'Guest'}
                    </p>
                    <p className="truncate text-xs text-[#8a8179]">
                      {row.orderCode ? <span className="font-mono text-[11px] text-[#6b5545]">{row.orderCode}</span> : null}
                      {row.orderCode && row.productName ? <span> · </span> : null}
                      {row.productName || 'Order'}
                    </p>
                  </div>
                  {timeLabel ? <span className="shrink-0 text-[10px] text-[#a79a8b]">{timeLabel}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

/** @param {string | Date | undefined} value */
function formatSidebarTime(value) {
  if (value == null) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default BusinessChatSidebar
