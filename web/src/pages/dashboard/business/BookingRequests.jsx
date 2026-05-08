import { useMemo, useState } from 'react'
import { FiCalendar, FiPhone, FiSearch } from 'react-icons/fi'
import dayjs from 'dayjs'
import { useCustomerOrders } from '../../../hooks/useCustomerOrders.hook'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../../../shared/utils/touristOrderDisplay.utils'

const schedulePattern = /(schedule|date|visit|check-?in|arrival)\s*[:\-]\s*([^\n,;|]+)/i
const checkInPattern = /(check[\s-]*in|arrival|start date)\s*[:\-]\s*([^\n,;|]+)/i
const checkOutPattern = /(check[\s-]*out|departure|end date)\s*[:\-]\s*([^\n,;|]+)/i

const readRequestedSchedule = (order) => {
  const notes = String(order?.notes || '')
  const details = String(order?.productDetails || '')
  const text = `${notes}\n${details}`
  const match = text.match(schedulePattern)
  if (match?.[2]) return match[2].trim()
  return ''
}

const formatDateTime = (value) => {
  const date = dayjs(value)
  if (!date.isValid()) return '--'
  return date.format('MMM DD, YYYY hh:mm A')
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

const isPaidBookingComplete = (order) =>
  String(order?.orderType || '').toUpperCase() === 'BOOKING_REQUEST' &&
  String(order?.status || '').toUpperCase() === 'FINISHED'

const BookingRequests = () => {
  const { orders, isLoading, advanceOrderStatus, cancelOrder } = useCustomerOrders()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'))
  const [reviewingOrderId, setReviewingOrderId] = useState('')
  const [cancelDialogOrder, setCancelDialogOrder] = useState(null)

  const bookingRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const activeDate = String(dateFilter || '').trim()
    return orders.filter((order) => {
      if (isPaidBookingComplete(order)) return false
      const status = String(order?.status || '').toUpperCase()
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter
      const matchesDate = !activeDate || dayjs(order?.createdAt).isSame(dayjs(activeDate), 'day')
      const matchesQuery =
        !query ||
        String(order?.customer || '')
          .toLowerCase()
          .includes(query) ||
        String(order?.customerPhone || '')
          .toLowerCase()
          .includes(query) ||
        String(order?.orderCode || '')
          .toLowerCase()
          .includes(query) ||
        String(order?.productName || '')
          .toLowerCase()
          .includes(query) ||
        String(readRequestedSchedule(order))
          .toLowerCase()
          .includes(query)
      return matchesStatus && matchesDate && matchesQuery
    })
  }, [orders, searchQuery, statusFilter, dateFilter])

  const reviewingOrder = useMemo(
    () => bookingRequests.find((order) => order.id === reviewingOrderId) || null,
    [bookingRequests, reviewingOrderId]
  )

  const bookingFormDetails = useMemo(
    () => buildDetailRows(reviewingOrder?.notes),
    [reviewingOrder?.notes]
  )
  const reviewingCheckInOut = useMemo(() => parseCheckInOut(reviewingOrder), [reviewingOrder])

  const lineItems = Array.isArray(reviewingOrder?.lineItems) ? reviewingOrder.lineItems : []
  const reviewingStatus = String(reviewingOrder?.status || '').toUpperCase()
  const canApproveBooking = reviewingStatus === 'PLACED'
  const canCancelBooking = reviewingStatus === 'PLACED' || reviewingStatus === 'PROCESSING'
  const cancelDialogStatus = String(cancelDialogOrder?.status || '').toUpperCase()
  const cancelReasonText =
    cancelDialogStatus === 'PROCESSING'
      ? 'Booking canceled by resort while waiting for payment'
      : 'Booking request rejected by resort'

  const requestCancelBooking = (order, { closeReviewModal = false } = {}) => {
    if (!order?.id) return
    setCancelDialogOrder({
      id: order.id,
      status: String(order.status || ''),
      orderCode: String(order.orderCode || ''),
      productName: String(order.productName || 'Booking request'),
      closeReviewModal
    })
  }

  const closeCancelDialog = () => setCancelDialogOrder(null)

  const confirmCancelBooking = () => {
    if (!cancelDialogOrder?.id) return
    cancelOrder(cancelDialogOrder.id, cancelReasonText)
    if (cancelDialogOrder.closeReviewModal) {
      setReviewingOrderId('')
    }
    closeCancelDialog()
  }

  return (
    <>
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-[#2f2f2f]">Booking Requests</h1>
            <p className="text-sm text-[#6f665d]">
              See incoming booking requests, guest details, requested schedule, and current status.
            </p>
          </div>
          <p className="rounded-full bg-[#fff4e8] px-3 py-1 text-xs font-medium text-[#9b5a2c]">
            {bookingRequests.length} request(s)
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9a8b7c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by guest, phone, booking code, or requested schedule"
              className="w-full rounded-xl border border-[#eadfce] bg-white py-2 pr-3 pl-9 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
            />
          </label>
          <div className="flex items-center gap-2">
            <label className="relative flex-1">
              <FiCalendar size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9a8b7c]" />
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-xl border border-[#eadfce] bg-white py-2 pr-3 pl-9 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
              />
            </label>
            <button
              type="button"
              onClick={() => setDateFilter(dayjs().format('YYYY-MM-DD'))}
              className="rounded-full border border-[#eadfce] bg-white px-3 py-2 text-xs font-semibold text-[#6f665d] transition hover:border-[#d4c4b6]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="rounded-full border border-[#eadfce] bg-white px-3 py-2 text-xs font-semibold text-[#6f665d] transition hover:border-[#d4c4b6]"
            >
              All
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          >
            <option value="ALL">All Status</option>
            <option value="PLACED">Waiting Approval</option>
            <option value="PROCESSING">Accepted</option>
            <option value="CANCELED">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
            Loading booking requests...
          </div>
        ) : bookingRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
            No booking requests found.
          </div>
        ) : (
          <div className="space-y-3">
            {bookingRequests.map((order) => {
              const schedule = readRequestedSchedule(order)
              const checkInOut = parseCheckInOut(order)
              const isPlaced = String(order?.status || '').toUpperCase() === 'PLACED'
              const isWaitingForPayment = String(order?.status || '').toUpperCase() === 'PROCESSING'
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setReviewingOrderId(order.id)}
                  className="w-full rounded-xl border border-[#ecdfd1] bg-[#fffdfb] p-4 text-left transition hover:border-[#d4c4b6] hover:bg-[#fff9f2]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#2f2f2f]">{order.customer || 'Guest name not provided'}</p>
                      <p className="text-xs text-[#8a7f74]">{order.productName || 'Booking request'}</p>
                      <p className="text-xs text-[#8a7f74]">Code: {order.orderCode || '--'}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${touristCustomerOrderStatusBadgeClass(order.status)}`}
                    >
                      {touristCustomerOrderStatusLabel(order.status) || 'Unknown'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-[#4d453e] md:grid-cols-2">
                    <p className="inline-flex items-center gap-2">
                      <FiPhone size={14} className="text-[#8a7f74]" />
                      {order.customerPhone || 'No phone provided'}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FiCalendar size={14} className="text-[#8a7f74]" />
                      {schedule || 'Schedule not specified'}
                    </p>
                    <p className="text-xs text-[#7f7266]">
                      Check-in: {checkInOut.checkIn || '--'} | Check-out: {checkInOut.checkOut || '--'}
                    </p>
                    <p className="text-xs text-[#7f7266]">Requested at: {formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setReviewingOrderId(order.id)
                      }}
                      className="rounded-full border border-[#d4c4b6] bg-white px-3 py-1.5 text-xs font-semibold text-[#8a4a33] transition hover:border-[#c3b1a1]"
                    >
                      Review
                    </button>
                    {isPlaced ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          advanceOrderStatus(order.id)
                        }}
                        className="rounded-full bg-[#ff7a1a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#eb6c12]"
                      >
                        Quick Approve
                      </button>
                    ) : null}
                    {isWaitingForPayment ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          requestCancelBooking(order)
                        }}
                        className="rounded-full border border-[#e7dfd5] bg-white px-3 py-1.5 text-xs font-semibold text-[#8a4a33] transition hover:border-[#d4c4b6]"
                      >
                        Cancel Booking
                      </button>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {reviewingOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#2f2f2f]">Booking Review</h2>
                <p className="text-xs text-[#8a7f74]">
                  {reviewingOrder.productName || 'Booking request'} · {reviewingOrder.orderCode || '--'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingOrderId('')}
                className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-semibold text-[#6f665d] transition hover:bg-[#f7f1ea]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-[#efe5db] bg-[#fcfaf7] p-3 text-sm text-[#4d453e] sm:grid-cols-2">
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Tourist</span>
                <br />
                {reviewingOrder.customer || 'Not provided'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Phone</span>
                <br />
                {reviewingOrder.customerPhone || 'Not provided'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Requested At</span>
                <br />
                {formatDateTime(reviewingOrder.createdAt)}
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
                {touristCustomerOrderStatusLabel(reviewingOrder.status) || 'Unknown'}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f]">Booked Package Photo</h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-[#efe5db] bg-[#fffdfb]">
                {String(reviewingOrder.productImage || '').trim() ? (
                  <img
                    src={String(reviewingOrder.productImage)}
                    alt={reviewingOrder.productName || 'Booked package'}
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
                        {item.qty} x {item.name} - ₱{Number(item.unit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-[#2f2f2f]">Total Amount: {reviewingOrder.total || '₱0.00'}</p>
              </div>
            </div>

            {canCancelBooking || canApproveBooking ? (
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {canCancelBooking ? (
                  <button
                    type="button"
                    onClick={() => requestCancelBooking(reviewingOrder, { closeReviewModal: true })}
                    className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-xs font-semibold text-[#8a4a33] transition hover:border-[#d4c4b6]"
                  >
                    {reviewingStatus === 'PROCESSING' ? 'Cancel Booking' : 'Decline Booking'}
                  </button>
                ) : null}
                {canApproveBooking ? (
                  <button
                    type="button"
                    onClick={() => {
                      advanceOrderStatus(reviewingOrder.id)
                      setReviewingOrderId('')
                    }}
                    className="rounded-full bg-[#ff7a1a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#eb6c12]"
                  >
                    Approve Booking
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {cancelDialogOrder ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#2f2f2f]">Confirm booking cancellation</h3>
            <p className="mt-2 text-sm text-[#6f665d]">
              {cancelDialogStatus === 'PROCESSING'
                ? 'This booking is waiting for payment. Are you sure you want to cancel it?'
                : 'Are you sure you want to decline this booking request?'}
            </p>
            <p className="mt-3 text-xs text-[#8a7f74]">
              {cancelDialogOrder.productName} · {cancelDialogOrder.orderCode || '--'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCancelDialog}
                className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-xs font-semibold text-[#6f665d] transition hover:bg-[#f7f1ea]"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={confirmCancelBooking}
                className="rounded-full bg-[#8a4a33] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#7a3f2b]"
              >
                {cancelDialogStatus === 'PROCESSING' ? 'Yes, Cancel Booking' : 'Yes, Decline Booking'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default BookingRequests
