import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FiCalendar, FiClock, FiMessageCircle, FiPhone, FiUser } from 'react-icons/fi'
import { useCustomerOrders } from '../../../hooks/useCustomerOrders.hook'
import { touristCustomerOrderStatusBadgeClass, touristCustomerOrderStatusLabel } from '../../../shared/utils/touristOrderDisplay.utils'
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

/** e.g. `2026, May 9, 8:00 AM` */
const formatModalDateTime = (value) => {
  const date = dayjs(value)
  if (!date.isValid()) return '--'
  return date.format('YYYY, MMM D, h:mm A')
}

const resolveCheckInMoment = (booking) => {
  const raw = String(booking.checkIn || booking.schedule || '').trim()
  let d = dayjs(raw)
  if (d.isValid()) return d
  const key = String(booking.checkInDateKey || booking.date || '').trim()
  if (key) {
    d = dayjs(`${key}T12:00:00`)
    if (d.isValid()) return d
  }
  return null
}

const resolveCheckOutMoment = (booking) => {
  const raw = String(booking.checkOut || '').trim()
  if (raw) {
    const d = dayjs(raw)
    if (d.isValid()) return d
  }
  const key = String(booking.checkOutDateKey || '').trim()
  if (key) {
    const d = dayjs(`${key}T12:00:00`)
    if (d.isValid()) return d
  }
  return resolveCheckInMoment(booking)
}

/** Timeline vs now: stay already finished after check-out vs still active/upcoming */
const getStayTimelineStatus = (booking) => {
  const out = resolveCheckOutMoment(booking)
  const now = dayjs()
  if (!out?.isValid()) {
    const inn = resolveCheckInMoment(booking)
    if (!inn?.isValid()) return 'reserved'
    return now.isAfter(inn.endOf('day')) ? 'ended' : 'reserved'
  }
  return now.isAfter(out) ? 'ended' : 'reserved'
}

const formatBookingCheckInDisplay = (booking) => {
  const raw = String(booking.checkIn || booking.schedule || '').trim()
  let d = dayjs(raw)
  if (d.isValid()) return formatModalDateTime(d)
  const k = String(booking.checkInDateKey || booking.date || '').trim()
  if (k) {
    d = dayjs(`${k}T00:00:00`)
    if (d.isValid()) return formatModalDateTime(d)
  }
  return '--'
}

const formatBookingCheckOutDisplay = (booking) => {
  const raw = String(booking.checkOut || '').trim()
  if (raw) {
    const d = dayjs(raw)
    if (d.isValid()) return formatModalDateTime(d)
  }
  const k = String(booking.checkOutDateKey || '').trim()
  if (k) {
    const d = dayjs(`${k}T00:00:00`)
    if (d.isValid()) return formatModalDateTime(d)
  }
  return '--'
}

const StayTimelineStatusBadge = ({ booking }) => {
  const timeline = getStayTimelineStatus(booking)
  if (timeline === 'ended') {
    return (
      <span className="shrink-0 rounded-full bg-[#edf2f7] px-2.5 py-0.5 text-[11px] font-medium text-[#4a5568]">
        Ended booking
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-[#e8f2ff] px-2.5 py-0.5 text-[11px] font-medium text-[#1a5278]">
      Reserved
    </span>
  )
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

const parseDateKey = (value) => {
  const parsed = dayjs(String(value || '').trim())
  if (!parsed.isValid()) return ''
  return parsed.format('YYYY-MM-DD')
}

/** Distinct colors per booking (markers use `stroke`) */
const BOOKING_PALETTE = [
  { fill: '#1976d2', stroke: '#0d47a1' },
  { fill: '#388e3c', stroke: '#1b5e20' },
  { fill: '#7b1fa2', stroke: '#4a148c' },
  { fill: '#c2185b', stroke: '#880e4f' },
  { fill: '#f57c00', stroke: '#e65100' },
  { fill: '#00796b', stroke: '#004d40' },
  { fill: '#5d4037', stroke: '#3e2723' },
  { fill: '#303f9f', stroke: '#1a237e' },
  { fill: '#c62828', stroke: '#b71c1c' },
  { fill: '#0097a7', stroke: '#006064' },
  { fill: '#689f38', stroke: '#33691e' },
  { fill: '#6a1b9a', stroke: '#38006b' }
]

/** Feather-style paths, 24×24 */
const SVG_USER_PATHS = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
const SVG_FLAG_PATHS =
  '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'

const MARKER_ICON_SIZE = 20
const MARKER_DOT_SIZE = 11

const bookingMarkerSvg = (paths, stroke, size = MARKER_ICON_SIZE) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

/**
 * @param {Array<Record<string, unknown>>} items
 * @returns {{ segmentMap: Map<string, Array<{ bookingId: string, colorIndex: number, role: 'start' | 'end' | 'middle' | 'single', customer: string }>>, colorIndexByBookingId: Map<string, number> }}
 */
const buildPerBookingCalendarSegments = (items) => {
  const sorted = [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  /** @type {Map<string, number>} */
  const colorIndexByBookingId = new Map()
  sorted.forEach((r, i) => {
    colorIndexByBookingId.set(String(r.id), i % BOOKING_PALETTE.length)
  })

  /** @type {Map<string, Array<{ bookingId: string, colorIndex: number, role: 'start' | 'end' | 'middle' | 'single', customer: string }>>} */
  const segmentMap = new Map()

  const pushSeg = (dateKey, seg) => {
    if (!dateKey) return
    if (!segmentMap.has(dateKey)) segmentMap.set(dateKey, [])
    segmentMap.get(dateKey).push(seg)
  }

  for (const r of items) {
    const startRaw = String(r.checkIn || r.schedule || '').trim()
    let start = dayjs(startRaw)
    if (!start.isValid()) {
      const fallback = r.checkInDateKey ? dayjs(r.checkInDateKey) : null
      if (!fallback?.isValid()) continue
      start = fallback
    }
    const endRaw = String(r.checkOut || '').trim()
    let end = endRaw ? dayjs(endRaw) : start
    if (endRaw && !end.isValid()) end = start
    if (end.isBefore(start, 'day')) {
      const tmp = start
      start = end
      end = tmp
    }

    const startDay = start.startOf('day')
    const endDay = end.startOf('day')
    const colorIndex = colorIndexByBookingId.get(String(r.id)) ?? 0
    const customer = String(r.customer || 'Guest')

    let cursor = startDay
    while (cursor.isBefore(endDay, 'day') || cursor.isSame(endDay, 'day')) {
      const key = cursor.format('YYYY-MM-DD')
      const sameDay = startDay.isSame(endDay, 'day')
      /** @type {'start' | 'end' | 'middle' | 'single'} */
      let role = 'middle'
      if (sameDay) role = 'single'
      else if (cursor.isSame(startDay, 'day')) role = 'start'
      else if (cursor.isSame(endDay, 'day')) role = 'end'
      pushSeg(key, { bookingId: String(r.id), colorIndex, role, customer })
      cursor = cursor.add(1, 'day')
    }
  }

  for (const arr of segmentMap.values()) {
    arr.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
  }

  return { segmentMap, colorIndexByBookingId }
}

/** Inclusive calendar-day range [check-in … check-out] */
const reservationSpansDate = (item, dateKey) => {
  const startRaw = String(item.checkIn || item.schedule || '').trim()
  let start = dayjs(startRaw)
  if (!start.isValid()) {
    const fb = item.checkInDateKey ? dayjs(item.checkInDateKey) : null
    if (!fb?.isValid()) return String(item.date || '') === dateKey
    start = fb
  }
  const endRaw = String(item.checkOut || '').trim()
  let end = endRaw ? dayjs(endRaw) : start
  if (endRaw && !end.isValid()) end = start
  if (end.isBefore(start, 'day')) {
    const t = start
    start = end
    end = t
  }
  const d = dayjs(dateKey).startOf('day')
  const s = start.startOf('day')
  const e = end.startOf('day')
  return !d.isBefore(s, 'day') && !d.isAfter(e, 'day')
}

const reservationEndsOnDate = (item, dateKey) => {
  const endKey = String(item.checkOutDateKey || parseDateKey(item.checkOut) || '').trim()
  if (endKey) return endKey === dateKey
  const startKey = String(item.checkInDateKey || item.date || '').trim()
  return Boolean(startKey) && startKey === dateKey
}

const bindFlagTap = (el, onActivate) => {
  el.style.cursor = 'pointer'
  el.style.pointerEvents = 'auto'
  el.setAttribute('role', 'button')
  el.tabIndex = 0
  el.setAttribute('aria-label', 'Show guests checking out this day')
  const onTap = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onActivate()
  }
  el.addEventListener('click', onTap)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTap(e)
    }
  })
}

const clearBookingDayLayers = (frame) => {
  frame?.querySelectorAll('.tb-res-layer').forEach((node) => node.remove())
}

/**
 * @param {{ onFlagClick: () => void }} handlers — flag opens check-out-only modal for this cell’s date
 */
const paintBookingDayLayers = (frame, segments, handlers) => {
  if (!frame || !segments?.length) return
  if (!frame.style.position || frame.style.position === 'static') frame.style.position = 'relative'

  const bar = document.createElement('div')
  bar.className = 'tb-res-layer'
  bar.style.cssText = [
    'position:absolute',
    'bottom:4px',
    'left:0',
    'right:0',
    'display:flex',
    'flex-wrap:wrap',
    'justify-content:center',
    'align-items:center',
    'gap:8px',
    'pointer-events:none',
    'z-index:1',
    'line-height:0'
  ].join(';')

  const { onFlagClick } = handlers

  segments.forEach((seg) => {
    const { stroke } = BOOKING_PALETTE[seg.colorIndex % BOOKING_PALETTE.length]
    const col = document.createElement('span')
    col.style.cssText = 'display:inline-flex;align-items:center;gap:4px;line-height:0'

    const tip = (suffix) => `${seg.customer} · ${suffix}`

    if (seg.role === 'single') {
      const userSpan = document.createElement('span')
      userSpan.style.cssText = 'pointer-events:none;display:inline-flex'
      userSpan.innerHTML = bookingMarkerSvg(SVG_USER_PATHS, stroke, MARKER_ICON_SIZE)
      const flagSpan = document.createElement('span')
      flagSpan.style.display = 'inline-flex'
      flagSpan.innerHTML = bookingMarkerSvg(SVG_FLAG_PATHS, stroke, MARKER_ICON_SIZE)
      bindFlagTap(flagSpan, onFlagClick)
      flagSpan.title = `${tip('check-out')} — click flag to list check-outs this day`
      userSpan.title = tip('check-in')
      col.appendChild(userSpan)
      col.appendChild(flagSpan)
    } else if (seg.role === 'start') {
      col.style.pointerEvents = 'none'
      col.innerHTML = bookingMarkerSvg(SVG_USER_PATHS, stroke, MARKER_ICON_SIZE)
      col.title = tip('check-in')
    } else if (seg.role === 'end') {
      col.style.pointerEvents = 'auto'
      const flagSpan = document.createElement('span')
      flagSpan.style.display = 'inline-flex'
      flagSpan.innerHTML = bookingMarkerSvg(SVG_FLAG_PATHS, stroke, MARKER_ICON_SIZE)
      bindFlagTap(flagSpan, onFlagClick)
      flagSpan.title = `${tip('check-out')} — click to list check-outs this day`
      col.appendChild(flagSpan)
    } else {
      col.style.pointerEvents = 'none'
      const dot = document.createElement('span')
      dot.style.cssText = `width:${MARKER_DOT_SIZE}px;height:${MARKER_DOT_SIZE}px;border-radius:9999px;background:${stroke};display:inline-block;flex-shrink:0`
      col.appendChild(dot)
      col.title = tip('booked night')
    }

    bar.appendChild(col)
  })

  frame.appendChild(bar)
}

const Reservations = () => {
  const navigate = useNavigate()
  const { orders, isLoading } = useCustomerOrders()
  const [selectedDate, setSelectedDate] = useState('')
  /** `span` = any stay touching the day; `checkout` = opened via flag, only guests checking out that day */
  const [dayModalMode, setDayModalMode] = useState(/** @type {'span' | 'checkout'} */ ('span'))
  const [reviewingBookingId, setReviewingBookingId] = useState('')
  const [messagingBookingId, setMessagingBookingId] = useState('')

  const closeDayModal = () => {
    setSelectedDate('')
    setDayModalMode('span')
  }

  const openDayModal = useCallback((dateStr, mode) => {
    setDayModalMode(mode)
    setSelectedDate(dateStr)
  }, [])

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
        const checkInDateKey = parseDateKey(checkInOut.checkIn) || parseDateKey(schedule) || date
        const checkOutDateKey = parseDateKey(checkInOut.checkOut)
        return {
          ...order,
          date,
          checkIn: checkInOut.checkIn,
          checkOut: checkInOut.checkOut,
          schedule,
          checkInDateKey,
          checkOutDateKey
        }
      })
      .filter((order) => Boolean(order.date))
  }, [orders])

  const { segmentMap: calendarDaySegments, colorIndexByBookingId } = useMemo(
    () => buildPerBookingCalendarSegments(reservations),
    [reservations]
  )

  const calendarPaintKey = useMemo(
    () => reservations.map((r) => `${r.id}|${r.checkIn}|${r.checkOut}|${r.schedule}`).join(';;'),
    [reservations]
  )

  const decorateBookingDayCell = useCallback(
    (info) => {
      const dateKey = dayjs(info.date).format('YYYY-MM-DD')
      const segments = calendarDaySegments.get(dateKey)
      const frame = info.el.querySelector('.fc-daygrid-day-frame')
      if (!frame) return
      clearBookingDayLayers(frame)
      if (!segments?.length) return
      paintBookingDayLayers(frame, segments, {
        onFlagClick: () => openDayModal(dateKey, 'checkout')
      })
    },
    [calendarDaySegments, openDayModal]
  )

  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return []
    if (dayModalMode === 'checkout') {
      return reservations.filter((item) => reservationEndsOnDate(item, selectedDate))
    }
    return reservations.filter((item) => reservationSpansDate(item, selectedDate))
  }, [reservations, selectedDate, dayModalMode])
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
              className="[&_.fc]:text-[#2f2f2f] [&_.fc-theme-standard_.fc-scrollgrid]:border-[#e7dfd5] [&_.fc-theme-standard_td]:border-[#efe5db] [&_.fc-theme-standard_th]:border-[#efe5db] [&_.fc-col-header-cell]:bg-[#f8f5f0] [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:text-[#6f665d] [&_.fc-daygrid-day-frame]:relative [&_.fc-daygrid-day-frame]:min-h-18 [&_.fc-daygrid-day-number]:relative [&_.fc-daygrid-day-number]:z-2 [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:text-[#6f665d] [&_.fc-day-today]:bg-[#fff3e8] [&_.fc-toolbar-title]:text-xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-[#2f2f2f] [&_.fc-toolbar.fc-header-toolbar]:mb-2 [&_.fc_.fc-button]:rounded-md [&_.fc_.fc-button]:px-2 [&_.fc_.fc-button]:py-1 [&_.fc_.fc-button]:text-xs [&_.fc_.fc-button]:font-medium [&_.fc_.fc-button]:shadow-none [&_.fc_.fc-button-primary:focus]:shadow-none"
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
                key={calendarPaintKey}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={[]}
                dayCellDidMount={decorateBookingDayCell}
                dayCellWillUnmount={(info) => {
                  const frame = info.el.querySelector('.fc-daygrid-day-frame')
                  clearBookingDayLayers(frame)
                }}
                dateClick={(info) => openDayModal(info.dateStr, 'span')}
                height="auto"
                aspectRatio={2.5}
                fixedWeekCount={false}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
              />
            </div>
          )}
          {!isLoading && reservations.length > 0 ? (
            <div className="mt-3 border-t border-[#e7dfd5] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7f74]">Guest colors</p>
              <p className="mt-1 text-[11px] text-[#6f665d]">
                Each guest has a color: <span className="font-semibold text-[#4d453e]">person</span> icon on
                check-in, a <span className="font-semibold text-[#4d453e]">dot</span> on days in between, and a{' '}
                <span className="font-semibold text-[#4d453e]">flag</span> on check-out (click the flag for who
                leaves that day).
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reservations.map((r) => {
                  const idx = colorIndexByBookingId.get(String(r.id)) ?? 0
                  const { stroke } = BOOKING_PALETTE[idx % BOOKING_PALETTE.length]
                  return (
                    <span
                      key={r.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#efe5db] bg-white px-2 py-0.5 text-[11px] text-[#4d453e]"
                      title={`${r.checkIn || ''} → ${r.checkOut || ''}`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: stroke }}
                        aria-hidden
                      />
                      <span className="truncate">{r.customer || 'Guest'}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          ) : null}
        </article>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#2f2f2f]">
                  {dayModalMode === 'checkout'
                    ? `Check-outs on ${formatDateLabel(selectedDate)}`
                    : `Bookings on ${formatDateLabel(selectedDate)}`}
                </h2>
                <p className="text-xs text-[#6f665d]">
                  {dayModalMode === 'checkout'
                    ? `${selectedDateReservations.length} guest(s) checking out`
                    : `${selectedDateReservations.length} stay(s) on this day`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDayModal}
                className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-medium text-[#6f665d] transition hover:bg-[#f5eee4]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {selectedDateReservations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#ece3d9] bg-[#faf6f1] p-4 text-sm text-[#7a7168]">
                  {dayModalMode === 'checkout'
                    ? 'No check-outs scheduled for this date.'
                    : 'No bookings include this date.'}
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
                      <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#2f2f2f]">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{
                            backgroundColor:
                              BOOKING_PALETTE[
                                (colorIndexByBookingId.get(String(booking.id)) ?? 0) % BOOKING_PALETTE.length
                              ].stroke
                          }}
                          aria-hidden
                        />
                        <span className="truncate">{booking.productName || 'Booking request'}</span>
                      </p>
                      <StayTimelineStatusBadge booking={booking} />
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
                      <FiUser size={12} />
                      {booking.customer || 'Guest'}
                    </p>
                    <p className="mt-1 flex flex-col gap-0.5 text-xs text-[#6f665d]">
                      <span className="inline-flex items-start gap-1.5">
                        <FiClock size={12} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="font-medium text-[#4d453e]">Check-in:</span>{' '}
                          {formatBookingCheckInDisplay(booking)}
                        </span>
                      </span>
                      {booking.checkOut || booking.checkOutDateKey ? (
                        <span className="inline-flex items-start gap-1.5 pl-[18px]">
                          <span>
                            <span className="font-medium text-[#4d453e]">Check-out:</span>{' '}
                            {formatBookingCheckOutDisplay(booking)}
                          </span>
                        </span>
                      ) : null}
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
                {formatModalDateTime(reviewingBooking.createdAt)}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Check-in</span>
                <br />
                {formatBookingCheckInDisplay(reviewingBooking)}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Check-out</span>
                <br />
                {formatBookingCheckOutDisplay(reviewingBooking)}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Stay</span>
                <br />
                <StayTimelineStatusBadge booking={reviewingBooking} />
              </p>
              <p>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7f74]">Order status</span>
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
