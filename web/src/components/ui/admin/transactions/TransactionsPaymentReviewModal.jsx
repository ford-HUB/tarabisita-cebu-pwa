import { useCallback, useEffect, useState } from 'react'
import { FiAlertCircle, FiCheck, FiImage, FiRefreshCw, FiX, FiXCircle } from 'react-icons/fi'
import { useShallow } from 'zustand/react/shallow'
import { formatDate } from '../request-approval/utils'
import { formatBillingPeso } from '../../../../shared/utils/billingDisplay.utils'
import { paymentStatusPresentation } from './transactions.constants'
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

/** Keyed by payment id so decline form state resets when opening a different row. */
const PaymentReviewActions = ({
  d,
  paymentDetailLoading,
  paymentActionBusy,
  approvePaymentReview,
  rejectPaymentReview
}) => {
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const onAccept = useCallback(() => {
    if (!window.confirm('Are you sure you want to accept this payment?')) return
    void approvePaymentReview()
  }, [approvePaymentReview])

  const onDeclineSubmit = useCallback(() => {
    if (!window.confirm('Are you sure you want to decline this payment?')) return
    void rejectPaymentReview(declineReason)
  }, [declineReason, rejectPaymentReview])

  const isPending = d?.status === 'PENDING'
  if (!isPending || !d) return null

  return (
    <>
      {declineOpen ? (
        <div className="rounded-xl border border-[#f0e7dd] bg-[#fcfaf7] p-3">
          <label className="block text-xs font-medium text-[#6f655b]" htmlFor="decline-reason">
            Reason for decline (optional)
          </label>
          <textarea
            id="decline-reason"
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            maxLength={2000}
            placeholder="Explain why this payment is being declined…"
            className="mt-2 w-full resize-y rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#ff7a1a]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={paymentActionBusy}
              onClick={() => {
                setDeclineOpen(false)
                setDeclineReason('')
              }}
              className="rounded-xl border border-[#e1d4c5] px-4 py-2 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={paymentActionBusy}
              onClick={onDeclineSubmit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 min-[360px]:flex-none"
            >
              <FiXCircle size={16} aria-hidden />
              {paymentActionBusy ? 'Processing…' : 'Decline payment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={paymentActionBusy || paymentDetailLoading || !d}
            onClick={onAccept}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            <FiCheck size={18} aria-hidden />
            {paymentActionBusy ? 'Processing…' : 'Accept payment'}
          </button>
          <button
            type="button"
            disabled={paymentActionBusy || paymentDetailLoading || !d}
            onClick={() => setDeclineOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            <FiXCircle size={18} aria-hidden />
            Decline
          </button>
        </div>
      )}
    </>
  )
}

const TransactionsPaymentReviewModal = () => {
  const {
    reviewPaymentId,
    paymentDetail,
    paymentDetailLoading,
    paymentDetailError,
    paymentActionBusy,
    closePaymentReview,
    approvePaymentReview,
    rejectPaymentReview,
    loadPaymentDetail
  } = useAdminTransactionsStore(
    useShallow((s) => ({
      reviewPaymentId: s.reviewPaymentId,
      paymentDetail: s.paymentDetail,
      paymentDetailLoading: s.paymentDetailLoading,
      paymentDetailError: s.paymentDetailError,
      paymentActionBusy: s.paymentActionBusy,
      closePaymentReview: s.closePaymentReview,
      approvePaymentReview: s.approvePaymentReview,
      rejectPaymentReview: s.rejectPaymentReview,
      loadPaymentDetail: s.loadPaymentDetail
    }))
  )

  useEffect(() => {
    if (!reviewPaymentId) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (paymentActionBusy) return
      closePaymentReview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reviewPaymentId, paymentActionBusy, closePaymentReview])

  const onBackdrop = useCallback(
    (e) => {
      if (e.target !== e.currentTarget || paymentActionBusy) return
      closePaymentReview()
    },
    [closePaymentReview, paymentActionBusy]
  )

  if (!reviewPaymentId) return null

  const d = paymentDetail
  const statusUi = d?.status ? paymentStatusPresentation[d.status] || { label: d.status, tone: 'bg-[#f5f5f4] text-[#44403c]' } : null
  const isPending = d?.status === 'PENDING'
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
        aria-labelledby="admin-payment-review-title"
        className="flex max-h-[min(92vh,calc(100vh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#ece3d9] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
          <div className="min-w-0">
            <h2 id="admin-payment-review-title" className="text-lg font-semibold text-[#1f1f1f]">
              Payment review
            </h2>
            <p className="mt-1 font-mono text-xs text-[#6f655b]">{d?.orderId || reviewPaymentId}</p>
            {statusUi ? (
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusUi.tone}`}>
                {statusUi.label}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={paymentActionBusy}
            onClick={closePaymentReview}
            className="shrink-0 rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f7f3ed] disabled:opacity-50"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {paymentDetailLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm text-[#6f655b]">
              <span
                className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-[#e7dfd5] border-t-[#9b5a2c]"
                aria-hidden
              />
              Loading payment details…
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
                {d.adminReviewedAt ? (
                  <Row label="Reviewed at" value={formatDateTime(d.adminReviewedAt)} />
                ) : null}
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

        <div className="shrink-0 space-y-3 border-t border-[#f0e7dd] px-5 py-4">
          {isPending && d ? (
            <PaymentReviewActions
              key={reviewPaymentId}
              d={d}
              paymentDetailLoading={paymentDetailLoading}
              paymentActionBusy={paymentActionBusy}
              approvePaymentReview={approvePaymentReview}
              rejectPaymentReview={rejectPaymentReview}
            />
          ) : null}
          <button
            type="button"
            disabled={paymentActionBusy}
            onClick={closePaymentReview}
            className="w-full rounded-xl border border-[#e1d4c5] py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionsPaymentReviewModal
