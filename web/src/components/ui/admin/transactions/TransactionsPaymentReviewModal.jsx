import { useCallback, useEffect } from 'react'
import { FiAlertCircle, FiImage, FiRefreshCw, FiX } from 'react-icons/fi'
import { useShallow } from 'zustand/react/shallow'
import { formatDate } from '../request-approval/utils'
import { formatBillingPeso } from '../../../../shared/utils/billingDisplay.utils'
import { getTransactionStatusPresentation } from './transactions.constants'
import { useAdminTransactionsStore } from '../../../../store/admin/transactions.store'

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

const resolveReceiptSrc = (url) => {
  const u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  const base =
    import.meta.env.VITE_ENV === 'development'
      ? import.meta.env.VITE_SERVER_LOCAL
      : import.meta.env.VITE_SERVER_PRODUCTION
  const baseTrim = String(base || '').replace(/\/$/, '')
  if (!baseTrim) return u
  return u.startsWith('/') ? `${baseTrim}${u}` : `${baseTrim}/${u}`
}

const Section = ({ title, children }) => (
  <section className="rounded-xl border border-[#efe7dc] bg-[#fcfaf7] p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#824b24]">{title}</h3>
    <div className="mt-3 space-y-2 text-sm text-[#2f2f2f]">{children}</div>
  </section>
)

const Row = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 border-b border-[#f0e7dd] py-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-[#9d8f80]">{label}</span>
    <span className="min-w-0 break-words text-right font-medium text-[#1f1f1f] sm:text-left">{value ?? '—'}</span>
  </div>
)

/** Isolated state per `reviewPaymentId` via parent `key` — avoids reset effects when switching rows. */
const TransactionsPaymentReviewModalInner = () => {
  const { reviewPaymentId, paymentDetail, paymentDetailLoading, paymentDetailError, closePaymentReview, loadPaymentDetail } =
    useAdminTransactionsStore(
      useShallow((s) => ({
        reviewPaymentId: s.reviewPaymentId,
        paymentDetail: s.paymentDetail,
        paymentDetailLoading: s.paymentDetailLoading,
        paymentDetailError: s.paymentDetailError,
        closePaymentReview: s.closePaymentReview,
        loadPaymentDetail: s.loadPaymentDetail
      }))
    )

  useEffect(() => {
    if (!reviewPaymentId) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') closePaymentReview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reviewPaymentId, closePaymentReview])

  const onBackdrop = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return
      closePaymentReview()
    },
    [closePaymentReview]
  )

  const d = paymentDetail
  const statusUi = d?.status ? getTransactionStatusPresentation(d.status) : null
  const receiptSrc = d?.proofReceiptUrl ? resolveReceiptSrc(d.proofReceiptUrl) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-transaction-detail-title"
        className="flex max-h-[min(92vh,calc(100vh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#ece3d9] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
          <div className="min-w-0">
            <h2 id="admin-transaction-detail-title" className="text-lg font-semibold text-[#1f1f1f]">
              Transaction details
            </h2>
            <p className="mt-1 font-mono text-xs text-[#6f655b]">{d?.orderId || reviewPaymentId}</p>
            {statusUi ? (
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusUi.tone}`}
                aria-label={`Status: ${statusUi.label}`}
              >
                {statusUi.label}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closePaymentReview}
            className="shrink-0 rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <p className="mb-4 rounded-xl border border-[#e7dfd5] bg-[#fcfaf7] px-3 py-2.5 text-xs leading-relaxed text-[#6f655b]">
            Payment and subscription status are updated automatically by the system. This view is read-only.
          </p>

          {paymentDetailLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm text-[#6f655b]">
              <span
                className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-[#e7dfd5] border-t-[#9b5a2c]"
                aria-hidden
              />
              Loading transaction details…
            </div>
          ) : paymentDetailError ? (
            <div className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4">
              <div className="flex gap-2 text-sm text-amber-950">
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden />
                <p>{paymentDetailError}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadPaymentDetail(reviewPaymentId)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-4 py-2.5 text-sm font-medium text-[#9b5a2c] transition hover:bg-[#f7f3ed]"
              >
                <FiRefreshCw size={16} aria-hidden />
                Try again
              </button>
            </div>
          ) : d ? (
            <div className="space-y-4">
              <Section title="Transaction details">
                <Row label="Plan" value={d.planId || '—'} />
                <Row label="Billing period (months)" value={d.months != null ? String(d.months) : '—'} />
                <Row label="Amount" value={formatBillingPeso(d.amount)} />
                <Row label="Currency" value={d.currency || 'PHP'} />
                <Row label="Reference" value={d.requestReferenceNumber || '—'} />
                <Row label="Checkout / session id" value={d.checkoutSessionId || '—'} />
                <Row label="Provider payment id" value={d.xenditPaymentId || '—'} />
                <Row label="Created" value={formatDateTime(d.createdAt)} />
                <Row label="Updated" value={formatDateTime(d.updatedAt)} />
                <Row label="Paid at" value={d.paidAt ? formatDateTime(d.paidAt) : '—'} />
                <Row label="Subscription status" value={d.subscriptionStatus || '—'} />
                <Row label="Subscription ends" value={d.subscriptionEndsAt ? formatDate(d.subscriptionEndsAt) : '—'} />
                {d.notes ? <Row label="Notes" value={d.notes} /> : null}
                {d.declineReason ? <Row label="Decline reason (recorded)" value={d.declineReason} /> : null}
                {d.adminReviewedAt ? <Row label="Reviewed at" value={formatDateTime(d.adminReviewedAt)} /> : null}
                {d.adminReviewedByName ? <Row label="Reviewed by" value={d.adminReviewedByName} /> : null}
              </Section>

              <Section title="Restaurant / business">
                <Row label="Business name" value={d.business?.name} />
                <Row label="Phone" value={d.business?.phone} />
                <Row label="Address" value={d.business?.address} />
                <Row label="Website" value={d.business?.website} />
              </Section>

              <Section title="Account owner">
                <Row label="Name" value={d.owner?.name} />
                <Row label="Email" value={d.owner?.email} />
              </Section>

              <Section title="Proof of payment">
                {receiptSrc ? (
                  <div className="overflow-hidden rounded-lg border border-[#e7dfd5] bg-white">
                    <a
                      href={receiptSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border-b border-[#f0e7dd] px-3 py-2 text-xs font-medium text-[#9b5a2c] hover:underline"
                    >
                      <FiImage size={14} aria-hidden />
                      Open full size
                    </a>
                    <img
                      src={receiptSrc}
                      alt="Payment receipt"
                      className="max-h-[min(50vh,22rem)] w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[#6f655b]">No receipt image was uploaded for this transaction.</p>
                )}
              </Section>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[#f0e7dd] px-5 py-4">
          <button
            type="button"
            onClick={closePaymentReview}
            className="w-full rounded-xl border border-[#e1d4c5] py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const TransactionsPaymentReviewModal = () => {
  const reviewPaymentId = useAdminTransactionsStore((s) => s.reviewPaymentId)
  if (!reviewPaymentId) return null
  return <TransactionsPaymentReviewModalInner key={reviewPaymentId} />
}

export default TransactionsPaymentReviewModal
