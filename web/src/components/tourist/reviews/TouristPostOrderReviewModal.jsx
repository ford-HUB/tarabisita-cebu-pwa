import { useCallback, useEffect, useState } from 'react'
import { FiStar, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import {
  getMyRestaurantOrderReview,
  putMyRestaurantOrderReview
} from '../../../services/tourist/restaurantOrderReview.service.js'

const LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent'
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   orderId: string,
 *   businessName: string,
 *   onSubmitted?: () => void
 * }} props
 */
const TouristPostOrderReviewModal = ({ isOpen, onClose, orderId, businessName, onSubmitted }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eligible, setEligible] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const displayRating = hoverRating || rating

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await getMyRestaurantOrderReview(orderId)
      const payload = res?.data?.data
      setEligible(Boolean(payload?.eligible))
      const rev = payload?.review
      if (rev?.rating) {
        setRating(Number(rev.rating))
        setComment(String(rev.comment || ''))
      } else {
        setRating(0)
        setComment('')
      }
    } catch {
      toast.error('Could not load review options.')
      setEligible(false)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!isOpen || !orderId) return
    void load()
  }, [isOpen, orderId, load])

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.message('Choose a star rating from 1 to 5.')
      return
    }
    setSaving(true)
    try {
      await putMyRestaurantOrderReview(orderId, { rating, comment: comment.trim() })
      toast.success('Thank you for your feedback!')
      onSubmitted?.()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not save your review.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="post-order-review-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-[#e7dfd5] bg-[#fffaf6] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#eadfce] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b5a2c]">Rate your experience</p>
            <h2 id="post-order-review-title" className="mt-1 text-lg font-semibold text-[#1f1f1f]">
              {businessName || 'Restaurant'}
            </h2>
            <p className="mt-1 text-xs text-[#6b5f54]">Your order was paid successfully. How was everything?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#6b5f54] transition hover:bg-[#f5eee4] hover:text-[#1f1f1f]"
            aria-label="Dismiss"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#eadfce] border-t-[#ff7a1a]" />
            </div>
          ) : !eligible ? (
            <p className="text-center text-sm text-[#6b5f54]">This order is not eligible for a restaurant review.</p>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-[#3d352d]">Tap the stars</p>
                <div
                  className="mt-3 flex justify-center gap-1.5"
                  onMouseLeave={() => setHoverRating(0)}
                  role="radiogroup"
                  aria-label="Star rating"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = displayRating >= n
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        onMouseEnter={() => setHoverRating(n)}
                        onFocus={() => setHoverRating(n)}
                        onBlur={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="rounded-lg p-1.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a1a]/50 active:scale-95"
                      >
                        <FiStar
                          className={`h-10 w-10 sm:h-11 sm:w-11 ${active ? 'fill-amber-400 text-amber-500' : 'text-[#d4c4b6]'}`}
                          strokeWidth={active ? 0 : 1.8}
                          aria-hidden
                        />
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 min-h-[1.25rem] text-sm font-semibold text-[#c66b2b]">
                  {displayRating ? `${LABELS[displayRating] || ''} (${displayRating} of 5)` : ' '}
                </p>
              </div>

              <label className="mt-6 block">
                <span className="text-xs font-semibold text-[#5b534c]">Optional comment</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                  rows={4}
                  maxLength={2000}
                  placeholder="What stood out—food, service, packaging?"
                  className="mt-2 w-full resize-none rounded-xl border border-[#e7dfd5] bg-white px-3 py-2.5 text-sm text-[#1f1f1f] shadow-inner outline-none transition focus:border-[#c66b2b]/60"
                />
                <span className="mt-1 block text-right text-[10px] text-[#8a7f72]">{comment.length}/2000</span>
              </label>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b534c] transition hover:bg-[#fcfaf7]"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  disabled={saving || !rating}
                  onClick={() => void handleSubmit()}
                  className="rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TouristPostOrderReviewModal
