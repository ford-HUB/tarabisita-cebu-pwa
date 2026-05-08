import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiClock, FiMessageCircle, FiUser } from 'react-icons/fi'
import dayjs from 'dayjs'
import { getMyResortBookingRecords } from '../../../services/business/customerOrders.service'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../../../shared/utils/touristOrderDisplay.utils'
import { buildMailtoHref, buildWhatsAppHref } from '../../../shared/utils/touristOrderStoreMessaging.utils'

const checkInPattern = /(check[\s-]*in|arrival|start date)\s*[:\-]\s*([^\n,;|]+)/i
const checkOutPattern = /(check[\s-]*out|departure|end date)\s*[:\-]\s*([^\n,;|]+)/i
const emailPattern = /(email)\s*[:\-]\s*([^\s,;|]+)/i

const formatDate = (value) => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (value) => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

const formatPeso = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const amount = Number(raw.replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(amount)) return null
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDateTime = (value) => {
  const date = dayjs(value)
  if (!date.isValid()) return '--'
  return date.format('MMM DD, YYYY hh:mm A')
}

const buildDetailRows = (text) => {
  const raw = String(text || '')
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx <= 0) return { label: 'Detail', value: line }
      return {
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim()
      }
    })
}

const formatDetailLabel = (label) => {
  const normalized = String(label || '').trim().toLowerCase()
  if (normalized === 'item note' || normalized === 'item-notes' || normalized === 'item notes') {
    return 'Reservation date & time'
  }
  return label
}

const parseCheckInOut = (order) => {
  const notes = String(order?.notes || '')
  const details = String(order?.productDetails || '')
  const text = `${notes}\n${details}`
  const checkInMatch = text.match(checkInPattern)
  const checkOutMatch = text.match(checkOutPattern)
  return {
    checkIn: String(checkInMatch?.[2] || '').trim(),
    checkOut: String(checkOutMatch?.[2] || '').trim()
  }
}

const parseGuestEmail = (order) => {
  const notes = String(order?.notes || '')
  const details = String(order?.productDetails || '')
  const text = `${notes}\n${details}`
  const matched = text.match(emailPattern)
  const email = String(matched?.[2] || '').trim()
  return /\S+@\S+\.\S+/.test(email) ? email : ''
}

const buildGuestMessageHref = (order) => {
  const phone = String(order?.customerPhone || '').trim()
  const email = parseGuestEmail(order)
  const orderCode = String(order?.orderCode || '').trim()
  const productName = String(order?.productName || 'booking').trim()
  const customerName = String(order?.customer || 'guest').trim()
  const prefilled = `Hello ${customerName}, this is your resort regarding booking ${orderCode || '(no code)'} for ${productName}.`

  const whatsappHref = buildWhatsAppHref({
    phoneRaw: phone,
    prefilledText: prefilled
  })
  if (whatsappHref) return whatsappHref

  return buildMailtoHref({
    email,
    subject: `Tara Bisita booking update (${orderCode || 'no-code'})`,
    body: `${prefilled}\n\n`
  })
}

const readAmenities = (item) => {
  const directAmenities = String(item?.amenities || '').trim()
  if (directAmenities) return directAmenities

  const directAmenity = String(item?.amenity || '').trim()
  if (directAmenity) return directAmenity

  const details = String(item?.productDetails || '')
  const notes = String(item?.notes || '')
  const text = `${details}\n${notes}`.trim()

  const explicitMatch = text.match(/amenit(?:y|ies)?\s*[:\-]\s*([^\n|;]+)/i)
  if (String(explicitMatch?.[1] || '').trim()) {
    return String(explicitMatch[1]).trim()
  }

  return ''
}

const BookingsRecord = () => {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [reviewingBookingId, setReviewingBookingId] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        const response = await getMyResortBookingRecords()
        setRows(Array.isArray(response?.data?.data) ? response.data.data : [])
      } catch {
        setRows([])
      } finally {
        setIsLoading(false)
      }
    }
    void run()
  }, [])

  const bookingRecordRows = useMemo(() => {
    const allowedStatuses = new Set(['PROCESSING', 'FINISHED', 'CANCELED'])
    return rows.filter((item) => {
      const orderType = String(item?.orderType || '').toUpperCase()
      const status = String(item?.status || '').toUpperCase()
      if (orderType !== 'BOOKING_REQUEST') return false
      return allowedStatuses.has(status)
    })
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bookingRecordRows
    return bookingRecordRows.filter((item) =>
      [
        item?.orderCode,
        item?.customer,
        item?.productName,
        item?.productDetails,
        item?.status,
        touristCustomerOrderStatusLabel(item?.status)
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(q))
    )
  }, [query, bookingRecordRows])

  const reviewingBooking = useMemo(
    () => filtered.find((item) => item.id === reviewingBookingId) || rows.find((item) => item.id === reviewingBookingId) || null,
    [filtered, rows, reviewingBookingId]
  )

  const bookingFormDetails = useMemo(
    () => buildDetailRows(reviewingBooking?.notes),
    [reviewingBooking?.notes]
  )
  const reviewingCheckInOut = useMemo(() => parseCheckInOut(reviewingBooking), [reviewingBooking])

  const lineItems = Array.isArray(reviewingBooking?.lineItems) ? reviewingBooking.lineItems : []
  const reviewingGuestMessageHref = useMemo(() => buildGuestMessageHref(reviewingBooking), [reviewingBooking])

  return (
    <>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Bookings Record</h1>
          <p className="mt-1 text-sm text-[#6d645d]">All reservation records stored for your resort account.</p>
        </div>

        <article className="rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guest, booking code, package, or details"
            className="mb-4 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          />

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
              Loading booking records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
              No booking records found.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const amenities = readAmenities(item)
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReviewingBookingId(item.id)}
                  className="w-full rounded-xl cursor-pointer border border-[#ecdfd1] bg-[#fffdfb] p-3 text-left transition hover:border-[#d9c9b9] hover:bg-[#fff9f3]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-[#efe5db] bg-[#f6eee6]">
                      {String(item?.productImage || '').trim() ? (
                        <img
                          src={String(item.productImage)}
                          alt={item.productName || 'Booked package'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-medium text-[#8f8377]">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-x-2.5">
                          <p className="truncate text-sm font-semibold text-[#2f2f2f]">{item.productName || 'Booking'}</p>
                          <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-xs text-[#6f665d]">
                            <FiUser size={12} />
                            <span className="truncate">{item.customer || 'Guest'}</span>
                          </p>
                          {amenities ? <p className="mt-1 truncate text-xs text-[#7a6f63]">{amenities}</p> : null}
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
                            <FiCalendar size={12} />
                            {formatDate(item.createdAt)}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
                            <FiClock size={12} />
                            {formatTime(item.createdAt)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex rounded-full bg-[#fff0e3] px-2.5 py-1 text-xs font-semibold text-[#9b5a2c]">
                            {item.orderCode || item.id}
                          </span>
                          {formatPeso(item?.totalAmount ?? item?.totalRaw ?? item?.total) ? (
                            <p className="mt-0.5 text-xs font-semibold text-[#8a4a33] leading-none">
                              Price: {formatPeso(item?.totalAmount ?? item?.totalRaw ?? item?.total)}
                            </p>
                          ) : null}
                          <span
                            className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${touristCustomerOrderStatusBadgeClass(item.status)}`}
                          >
                            {touristCustomerOrderStatusLabel(item.status) || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          )}
        </article>
      </section>

      {reviewingBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#2f2f2f]">Booking Review</h2>
                <p className="text-xs text-[#8a7f74]">
                  {reviewingBooking.productName || 'Booking request'} · {reviewingBooking.orderCode || '--'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingBookingId('')}
                className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-semibold text-[#6f665d] transition hover:bg-[#f7f1ea]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-[#efe5db] bg-[#fcfaf7] p-3 text-sm text-[#4d453e] sm:grid-cols-2">
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Tourist</span>
                <br />
                {reviewingBooking.customer || 'Not provided'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Phone</span>
                <br />
                {reviewingBooking.customerPhone || 'Not provided'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Requested At</span>
                <br />
                {formatDateTime(reviewingBooking.createdAt)}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Check-in</span>
                <br />
                {reviewingCheckInOut.checkIn || '--'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Check-out</span>
                <br />
                {reviewingCheckInOut.checkOut || '--'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Status</span>
                <br />
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${touristCustomerOrderStatusBadgeClass(reviewingBooking.status)}`}
                >
                  {touristCustomerOrderStatusLabel(reviewingBooking.status) || 'Unknown'}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f]">Booked Package Photo</h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-[#efe5db] bg-[#fffdfb]">
                {String(reviewingBooking.productImage || '').trim() ? (
                  <img
                    src={String(reviewingBooking.productImage)}
                    alt={reviewingBooking.productName || 'Booked package'}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-[#7f7266]">
                    No booking photo available for this request.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f]">Booking Form Details</h3>
              <div className="mt-2 space-y-2 rounded-xl border border-[#efe5db] bg-[#fffdfb] p-3">
                {bookingFormDetails.length ? (
                  bookingFormDetails.map((row, index) => (
                    <p key={`${row.label}-${index}`} className="text-sm text-[#4d453e]">
                      <span className="font-semibold text-[#6f665d]">{formatDetailLabel(row.label)}:</span>{' '}
                      {row.value || '--'}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-[#7f7266]">No booking form details submitted.</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f]">Amount Details</h3>
              <div className="mt-2 rounded-xl border border-[#efe5db] bg-[#fffdfb] p-3">
                {lineItems.length ? (
                  <div className="space-y-1">
                    {lineItems.map((item) => (
                      <p key={item.menuItemId || item.name} className="text-sm text-[#4d453e]">
                        {item.qty} x {item.name} - ₱
                        {Number(item.unit || 0).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-[#2f2f2f]">
                  Total Amount: {formatPeso(reviewingBooking?.totalAmount ?? reviewingBooking?.totalRaw ?? reviewingBooking?.total) || '₱0.00'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <a
                href={reviewingGuestMessageHref || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (reviewingGuestMessageHref) return
                  event.preventDefault()
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  reviewingGuestMessageHref
                    ? 'border-[#d4c4b6] bg-white text-[#8a4a33] hover:border-[#c3b1a1]'
                    : 'cursor-not-allowed border-[#eee4d8] bg-[#f6f0e8] text-[#9f9387]'
                }`}
              >
                <FiMessageCircle size={14} />
                Message Tourist
              </a>
              <button
                type="button"
                onClick={() => setReviewingBookingId('')}
                className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-xs font-semibold text-[#8a4a33] transition hover:border-[#d4c4b6]"
              >
                Close
              </button>
            </div>
            {!reviewingGuestMessageHref ? (
              <p className="mt-2 text-right text-[11px] text-[#8a7f74]">
                Add tourist phone or email in the booking form to enable direct messaging.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default BookingsRecord
