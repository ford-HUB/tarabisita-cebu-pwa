import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FiCalendar, FiClock, FiMessageCircle, FiPhone, FiUser } from 'react-icons/fi'
import { useCustomerOrders } from '../../../hooks/useCustomerOrders.hook'
import {
  touristCustomerOrderStatusBadgeClass,
  touristCustomerOrderStatusLabel
} from '../../../shared/utils/touristOrderDisplay.utils'
import { getBusinessStoreMessagingConversations } from '../../../services/business/store-messaging.service.js'
import { buildBusinessStoreMessagingThreadHref } from '../../../components/layout/business/businessLayout.constants.js'

const schedulePattern = /(schedule|date|visit|check-?in|arrival)\s*[:\-]\s*([^\n,;|]+)/i
const checkInPattern = /(check[\s-]*in|arrival|start date)\s*[:\-]\s*([^\n,;|]+)/i
const checkOutPattern = /(check[\s-]*out|departure|end date)\s*[:\-]\s*([^\n,;|]+)/i

const formatPeso = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const amount = Number(raw.replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(amount)) return null
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDateLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`)
  if (!Number.isFinite(date.getTime())) return isoDate
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
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

const readRequestedSchedule = (order) => {
  const notes = String(order?.notes || '')
  const details = String(order?.productDetails || '')
  const text = `${notes}\n${details}`
  const match = text.match(schedulePattern)
  if (match?.[2]) return match[2].trim()
  return ''
}

const resolveCalendarDate = (order) => {
  const checkIn = parseCheckInOut(order).checkIn
  const schedule = readRequestedSchedule(order)
  const candidate = checkIn || schedule
  const parsed = dayjs(candidate)
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD')
  const fallback = dayjs(order?.createdAt)
  if (fallback.isValid()) return fallback.format('YYYY-MM-DD')
  return ''
}

const Reservations = () => {
  const navigate = useNavigate()
  const { orders, isLoading } = useCustomerOrders()
  const [selectedDate, setSelectedDate] = useState('')
  const [reviewingBookingId, setReviewingBookingId] = useState('')
  const [messagingBookingId, setMessagingBookingId] = useState('')

  const reservations = useMemo(() => {
    return orders
      .filter((order) => {
        const orderType = String(order?.orderType || '').toUpperCase()
        const status = String(order?.status || '').toUpperCase()
        return orderType === 'BOOKING_REQUEST' && status === 'FINISHED'
      })
      .map((order) => {
        const checkInOut = parseCheckInOut(order)
        const schedule = readRequestedSchedule(order)
        const date = resolveCalendarDate(order)
        return {
          ...order,
          date,
          checkIn: checkInOut.checkIn,
          checkOut: checkInOut.checkOut,
          schedule
        }
      })
      .filter((order) => Boolean(order.date))
  }, [orders])

  const calendarEvents = useMemo(() => {
    return reservations.map((item) => ({
      id: item.id,
      title: `${item.productName || 'Booking'} · ${item.customer || 'Guest'}`,
      date: item.date,
      extendedProps: {
        status: item.status
      }
    }))
  }, [reservations])

  const selectedDateReservations = useMemo(
    () => reservations.filter((item) => item.date === selectedDate),
    [reservations, selectedDate]
  )
  const reviewingBooking = useMemo(
    () =>
      selectedDateReservations.find((item) => item.id === reviewingBookingId) ||
      reservations.find((item) => item.id === reviewingBookingId) ||
      null,
    [selectedDateReservations, reservations, reviewingBookingId]
  )
  const bookingFormDetails = useMemo(
    () => buildDetailRows(reviewingBooking?.notes),
    [reviewingBooking?.notes]
  )
  const lineItems = Array.isArray(reviewingBooking?.lineItems) ? reviewingBooking.lineItems : []

  const openBookingConversation = async (booking) => {
    const targetOrderCode = String(booking?.orderCode || '').trim().toLowerCase()
    const targetCustomer = String(booking?.customer || '').trim().toLowerCase()
    if (!targetOrderCode && !targetCustomer) {
      toast.error('Missing booking details for chat.')
      return
    }
    setMessagingBookingId(String(booking?.id || ''))
    try {
      const res = await getBusinessStoreMessagingConversations()
      const rows = Array.isArray(res?.data?.data) ? res.data.data : []
      const matched =
        rows.find((row) => String(row?.orderCode || '').trim().toLowerCase() === targetOrderCode) ||
        rows.find((row) => String(row?.touristName || '').trim().toLowerCase() === targetCustomer)
      const conversationId = String(matched?.conversationId || '').trim()
      if (!conversationId) {
        toast.error('No chat thread found yet for this booking. Ask the tourist to message first.')
        return
      }
      navigate(`/${buildBusinessStoreMessagingThreadHref(conversationId)}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not open chat thread.')
    } finally {
      setMessagingBookingId('')
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2f2f2f]">Reservations</h1>
          <p className="text-sm text-[#6f665d]">Track booked schedules and upcoming guest stays.</p>
        </div>
        <span className="rounded-full bg-[#fff4e8] px-3 py-1 text-xs font-medium text-[#9b5a2c]">
          {reservations.length} booked
        </span>
      </div>

      <div>
        <article className="rounded-xl border border-[#e7dfd5] bg-[#fcfaf7] p-3">
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
              Loading reservations...
            </div>
          ) : (
            <div
              className="[&_.fc]:text-[#2f2f2f] [&_.fc-theme-standard_.fc-scrollgrid]:border-[#e7dfd5] [&_.fc-theme-standard_td]:border-[#efe5db] [&_.fc-theme-standard_th]:border-[#efe5db] [&_.fc-col-header-cell]:bg-[#f8f5f0] [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:text-[#6f665d] [&_.fc-daygrid-day-frame]:min-h-14 [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:text-[#6f665d] [&_.fc-day-today]:bg-[#fff3e8] [&_.fc-toolbar-title]:text-xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-[#2f2f2f] [&_.fc-toolbar.fc-header-toolbar]:mb-2 [&_.fc_.fc-button]:rounded-md [&_.fc_.fc-button]:px-2 [&_.fc_.fc-button]:py-1 [&_.fc_.fc-button]:text-xs [&_.fc_.fc-button]:font-medium [&_.fc_.fc-button]:shadow-none [&_.fc_.fc-button-primary:focus]:shadow-none [&_.fc-daygrid-event]:rounded-md [&_.fc-daygrid-event]:border-[#ff7a1a] [&_.fc-daygrid-event]:bg-[#ff7a1a] [&_.fc-daygrid-event]:text-[10px] [&_.fc-daygrid-event]:leading-tight [&_.fc-daygrid-event]:text-white"
              style={{
                '--fc-button-bg-color': '#f5eee4',
                '--fc-button-border-color': '#d5c5b2',
                '--fc-button-text-color': '#6f665d',
                '--fc-button-hover-bg-color': '#f0e7db',
                '--fc-button-hover-border-color': '#c7b39d',
                '--fc-button-active-bg-color': '#f2e8da',
                '--fc-button-active-border-color': '#9b5a2c',
                '--fc-button-active-text-color': '#9b5a2c'
              }}
            >
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                dateClick={(info) => setSelectedDate(info.dateStr)}
                eventClick={(info) => setSelectedDate(info.event.startStr.slice(0, 10))}
                height="auto"
                aspectRatio={2.7}
                fixedWeekCount={false}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                dayMaxEvents={2}
              />
            </div>
          )}
        </article>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#2f2f2f]">Bookings on {formatDateLabel(selectedDate)}</h2>
                <p className="text-xs text-[#6f665d]">
                  {selectedDateReservations.length} reservation(s) found
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-medium text-[#6f665d] transition hover:bg-[#f5eee4]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {selectedDateReservations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#ece3d9] bg-[#faf6f1] p-4 text-sm text-[#7a7168]">
                  No bookings for this date.
                </div>
              ) : (
                selectedDateReservations.map((booking) => (
                  <button
                    type="button"
                    key={booking.id}
                    onClick={() => setReviewingBookingId(booking.id)}
                    className="w-full rounded-lg border space-x-1.5 cursor-pointer border-[#efe5db] bg-[#fcfaf7] p-3 text-left transition hover:border-[#d4c4b6] hover:bg-[#fff9f2]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#2f2f2f]">{booking.productName || 'Booking request'}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${touristCustomerOrderStatusBadgeClass(booking.status)}`}
                      >
                        {touristCustomerOrderStatusLabel(booking.status) || 'Unknown'}
                      </span>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
                      <FiUser size={12} />
                      {booking.customer || 'Guest'}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
                      <FiClock size={12} />
                      {booking.checkIn || booking.schedule || '--'}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void openBookingConversation(booking)
                        }}
                        disabled={messagingBookingId === String(booking.id || '')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c4b6] bg-white px-3 py-1 text-[11px] font-semibold text-[#8a4a33] transition hover:border-[#c3b1a1] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiMessageCircle size={12} />
                        {messagingBookingId === String(booking.id || '') ? 'Opening...' : 'Message Tourist'}
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {reviewingBooking ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#2f2f2f]">Reservation Details</h2>
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
                {reviewingBooking.checkIn || '--'}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Check-out</span>
                <br />
                {reviewingBooking.checkOut || '--'}
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
              <h3 className="text-sm font-semibold text-[#2f2f2f]">Booked Package Details</h3>
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
                  Total Amount:{' '}
                  {formatPeso(reviewingBooking?.totalAmount ?? reviewingBooking?.totalRaw ?? reviewingBooking?.total) ||
                    '₱0.00'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  void openBookingConversation(reviewingBooking)
                }}
                disabled={messagingBookingId === String(reviewingBooking.id || '')}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c4b6] bg-white px-4 py-2 text-xs font-semibold text-[#8a4a33] transition hover:border-[#c3b1a1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiMessageCircle size={14} />
                {messagingBookingId === String(reviewingBooking.id || '') ? 'Opening...' : 'Message Tourist'}
              </button>
              <button
                type="button"
                onClick={() => setReviewingBookingId('')}
                className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-xs font-semibold text-[#8a4a33] transition hover:border-[#d4c4b6]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Reservations
