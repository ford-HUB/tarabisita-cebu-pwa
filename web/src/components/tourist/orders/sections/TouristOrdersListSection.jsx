import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FiArrowRight,
  FiChevronDown,
  FiMessageCircle,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag
} from 'react-icons/fi'
import {
  touristExploreHref,
  buildTouristExploreReorderHref,
  buildTouristStoreMessagingHref
} from '../../../layout/tourist/touristLayout.constants'
import { postStoreMessagingLinkToken } from '../../../../services/tourist/store-messaging.service.js'

const formatLineUnitPhp = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num) || num <= 0) return null
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const StoreAvatar = ({ src }) => {
  const [failed, setFailed] = useState(false)
  const show = Boolean(src) && !failed
  return (
    <div
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] bg-white shadow-sm"
      aria-hidden
    >
      {show ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#faf3ea] text-[#9b5a2c]">
          <FiShoppingBag className="h-6 w-6" />
        </div>
      )}
    </div>
  )
}

/**
 * @param {{
 *   groups?: { key: string, businessId: string, businessName: string, businessStoreImage?: string, orders: Record<string, unknown>[] }[],
 *   orders?: Record<string, unknown>[],
 *   isLoading: boolean,
 *   errorMessage: string | null,
 *   variant?: 'grouped' | 'history',
 *   excludeStatuses?: string[]
 * }} props
 */
const TouristOrdersListSection = ({
  groups = [],
  orders = [],
  isLoading,
  errorMessage,
  variant = 'grouped',
  excludeStatuses = []
}) => {
  const navigate = useNavigate()
  const [expandedKeys, setExpandedKeys] = useState(() => new Set())
  const [messagingOrderId, setMessagingOrderId] = useState(null)

  const goReorderMenuItem = useCallback(
    (order, line) => {
      if (!order?.businessId || !line?.menuItemId) {
        toast.error('Missing details to re-order this item.')
        return
      }
      navigate(buildTouristExploreReorderHref(order.businessId, line.menuItemId))
    },
    [navigate]
  )

  const goMessageStore = useCallback(
    async (order) => {
      if (!order?.businessId || !order?.id) {
        toast.error('Missing order details for chat.')
        return
      }
      setMessagingOrderId(order.id)
      try {
        const res = await postStoreMessagingLinkToken({
          businessId: order.businessId,
          customerOrderId: order.id
        })
        const token = res.data?.data?.messagingToken
        if (!token) {
          throw new Error('NO_TOKEN')
        }
        navigate(`/${buildTouristStoreMessagingHref(token)}`)
      } catch {
        toast.error('Could not open chat. Please try again.')
      } finally {
        setMessagingOrderId(null)
      }
    },
    [navigate]
  )

  const toggleGroup = useCallback((key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const hiddenStatuses = useMemo(
    () => new Set((Array.isArray(excludeStatuses) ? excludeStatuses : []).map((s) => String(s || '').toUpperCase())),
    [excludeStatuses]
  )

  const visibleGroups = useMemo(() => {
    if (variant === 'history' || !hiddenStatuses.size) return groups
    return groups
      .map((group) => ({
        ...group,
        orders: (Array.isArray(group.orders) ? group.orders : []).filter(
          (order) => !hiddenStatuses.has(String(order?.statusKey || '').toUpperCase())
        )
      }))
      .filter((group) => group.orders.length > 0)
  }, [groups, hiddenStatuses, variant])

  const historyOrders = Array.isArray(orders) ? orders : []
  const totalOrders =
    variant === 'history' ? historyOrders.length : visibleGroups.reduce((n, g) => n + g.orders.length, 0)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-8 shadow-sm">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#f0e8de]" />
        <p className="mt-4 text-center text-sm text-[#5b5b5b]">Loading your orders…</p>
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

  if (!totalOrders) {
    return (
      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-8 shadow-sm md:p-10">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5eee4] text-[#9b5a2c]">
            <FiPackage className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[#1f1f1f]">No orders yet</h2>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Browse verified restaurants on Explore and place an order when a partner supports online ordering.
          </p>
          <Link
            to={touristExploreHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#eb6c12]"
          >
            Go to Explore
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    )
  }

  if (variant === 'history') {
    return (
      <ul className="space-y-3">
        {historyOrders.map((order) => (
          <li key={String(order.id)} className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
              <div className="flex shrink-0 justify-center md:justify-start">
                {order.productImage ? (
                  <img
                    src={String(order.productImage)}
                    alt=""
                    className="h-20 w-20 rounded-xl border border-[#ece3d9] object-cover md:h-24 md:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#ece3d9] bg-[#faf8f5] text-[#9b5a2c] md:h-24 md:w-24">
                    <FiPackage className="h-9 w-9" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1f1f1f]">{String(order.title || 'Order')}</p>
                    {order.subtitleParts?.length ? (
                      <p className="mt-0.5 font-mono text-xs text-[#6b5545]">{order.subtitleParts.join(' · ')}</p>
                    ) : null}
                  </div>
                  {order.statusLabel ? (
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${order.statusBadgeClass || 'bg-[#f5eee4] text-[#9b5a2c]'}`}
                    >
                      {order.statusLabel}
                    </span>
                  ) : null}
                </div>
                {order.lineItems?.length ? (
                  <div className="mt-4 rounded-xl border border-[#efe6dc] bg-[#fffcf8] p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Ordered items</p>
                    <ul className="mt-2.5 space-y-2.5">
                      {order.lineItems.map((line) => {
                        const unitLabel = formatLineUnitPhp(line.unit)
                        return (
                          <li
                            key={`${order.id}-${line.menuItemId}`}
                            className="flex flex-col gap-2 rounded-lg border border-[#ece3d9] bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2.5">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#ece3d9] bg-[#faf8f5]">
                                {line.image ? (
                                  <img src={line.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[#c4b5a8]">
                                    <FiPackage className="h-5 w-5" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[#1f1f1f]">{line.name || 'Item'}</p>
                                <p className="mt-0.5 text-xs text-[#6b655d]">
                                  <span className="font-medium text-[#5b4f45]">{line.qty}×</span>
                                  {unitLabel ? <span className="text-[#7a726a]"> · {unitLabel} each</span> : null}
                                </p>
                                {line.lineNotes ? (
                                  <p className="mt-1 text-xs italic text-[#8a7a6e]">Note: {line.lineNotes}</p>
                                ) : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => goReorderMenuItem(order, line)}
                              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-full border border-[#e7dfd5] bg-[#fffaf6] px-3 py-2 text-xs font-semibold text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a] sm:self-center"
                            >
                              <FiRefreshCw className="h-3.5 w-3.5" aria-hidden />
                              Re-order
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
                {order.statusKey === 'CANCELED' && order.cancelReason ? (
                  <p className="mt-2 text-xs text-[#8a6a5a]">Reason: {order.cancelReason}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#7a726a]">
                  {order.itemsCount != null ? (
                    <span>
                      {order.itemsCount} item{order.itemsCount === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  {order.total ? <span className="font-medium text-[#1f1f1f]">{order.total}</span> : null}
                  {order.time ? <span>{order.time}</span> : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {visibleGroups.map((group, groupIndex) => {
          const isOpen = expandedKeys.has(group.key)
          const panelId = `tourist-store-orders-panel-${groupIndex}`
          const headerId = `tourist-store-orders-h-${groupIndex}`
          const latest = group.orders[0]
          const count = group.orders.length

          return (
            <section
              key={group.key}
              className="overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm"
            >
              <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                  onClick={() => toggleGroup(group.key)}
                  className="flex flex-1 items-center gap-3 border-b border-transparent bg-[#faf6f1] px-4 py-4 text-left transition hover:bg-[#f3ebe0] sm:border-b-0 sm:border-r sm:border-[#ece3d9] sm:py-4 md:px-5"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e7dfd5] bg-white text-[#9b5a2c] transition ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <FiChevronDown className="h-5 w-5" />
                  </div>
                  <StoreAvatar src={group.businessStoreImage} />
                  <div className="min-w-0 flex-1 self-stretch py-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="text-base font-semibold text-[#1f1f1f] md:text-lg">{group.businessName}</h2>
                      <span className="rounded-full bg-[#fff0e3] px-2.5 py-0.5 text-xs font-medium text-[#9b5a2c]">
                        {count} order{count === 1 ? '' : 's'}
                      </span>
                      {group.dayLabel ? (
                        <span className="rounded-full bg-[#f3efe9] px-2.5 py-0.5 text-xs font-medium text-[#6d645d]">
                          {group.dayLabel}
                        </span>
                      ) : null}
                    </div>
                    {!isOpen && latest ? (
                      <p className="mt-2 text-sm text-[#5b5b5b]">
                        <span className="font-medium text-[#3f3a35]">Latest: </span>
                        {latest.title}
                        {latest.statusLabel ? (
                          <span className="text-[#7a726a]"> · {latest.statusLabel}</span>
                        ) : null}
                        {latest.time ? <span className="text-[#9f9387]"> · {latest.time}</span> : null}
                      </p>
                    ) : null}
                    {!isOpen ? (
                      <p className="mt-1 text-xs text-[#9f9387]">Tap to view all orders from this store.</p>
                    ) : null}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2 border-t border-[#ece3d9] bg-[#faf6f1] px-4 py-3 sm:flex-col sm:justify-center sm:border-t-0 sm:px-3 md:px-4">
                  {latest ? (
                    <button
                      type="button"
                      disabled={messagingOrderId === latest?.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        void goMessageStore(latest)
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e7dfd5] bg-white px-3 py-2 text-xs font-medium text-[#9b5a2c] shadow-sm transition hover:border-[#d4c4b4] hover:bg-[#fffaf6] enabled:cursor-pointer disabled:opacity-60 sm:w-auto sm:px-4 sm:text-sm"
                    >
                      <FiMessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">
                        {messagingOrderId === latest?.id ? 'Opening…' : 'Message store'}
                      </span>
                      <span className="sm:hidden">{messagingOrderId === latest?.id ? '…' : 'Message'}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {isOpen ? (
                <div id={panelId} role="region" aria-labelledby={headerId} className="border-t border-[#f0e8de] bg-white">
                  <ul className="divide-y divide-[#f0e8de]">
                    {group.orders.map((order) => (
                      <li key={order.id} className="p-4 md:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                          <div className="flex shrink-0 justify-center md:justify-start">
                            {order.productImage ? (
                              <img
                                src={order.productImage}
                                alt=""
                                className="h-20 w-20 rounded-xl border border-[#ece3d9] object-cover md:h-24 md:w-24"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#ece3d9] bg-[#faf8f5] text-[#9b5a2c] md:h-24 md:w-24">
                                <FiPackage className="h-9 w-9" aria-hidden />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-[#1f1f1f]">{order.title}</p>
                                {order.subtitleParts?.length ? (
                                  <p className="mt-0.5 font-mono text-xs text-[#6b5545]">
                                    {order.subtitleParts.join(' · ')}
                                  </p>
                                ) : null}
                              </div>
                              {order.statusLabel ? (
                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${order.statusBadgeClass || 'bg-[#f5eee4] text-[#9b5a2c]'}`}
                                >
                                  {order.statusLabel}
                                </span>
                              ) : null}
                            </div>
                            {order.detailPreview ? (
                              <pre className="mt-3 max-h-28 overflow-y-auto whitespace-pre-wrap wrap-break-word font-sans text-xs leading-relaxed text-[#6b655d]">
                                {order.detailPreview}
                              </pre>
                            ) : null}
                            {order.statusKey === 'CANCELED' && order.cancelReason ? (
                              <p className="mt-2 text-xs text-[#8a6a5a]">Reason: {order.cancelReason}</p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#7a726a]">
                              {order.itemsCount != null ? (
                                <span>
                                  {order.itemsCount} item{order.itemsCount === 1 ? '' : 's'}
                                </span>
                              ) : null}
                              {order.total ? (
                                <span className="font-medium text-[#1f1f1f]">{order.total}</span>
                              ) : null}
                              {order.time ? <span>{order.time}</span> : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </>
  )
}

export default TouristOrdersListSection
