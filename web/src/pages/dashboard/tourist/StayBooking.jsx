import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  buildTouristExploreBusinessDetailHref,
  touristOrdersHref,
  touristExploreHref
} from '../../../components/layout/tourist/touristLayout.constants.js'
import { useAuth } from '../../../hooks/useAuth.hook.js'
import { useTouristCartItemStore } from '../../../store/tourist/tourist-cart-item.store.js'
import { pickCartItemDetailsFromMenuItem } from '../../../shared/utils/tourist-cart-item-details.utils.js'
import { FiClock } from 'react-icons/fi'
import { postTouristCustomerOrder } from '../../../services/tourist/touristCustomerOrder.service.js'
import StayDatePickerField from '../../../components/tourist/stay/StayDatePickerField.jsx'

const STAY_BOOKING_PHONE_MAX_LENGTH = 11

const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const normalizeStayAddOns = (raw) => {
  if (!Array.isArray(raw) || !raw.length) return []
  const out = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = String(item.id || item.code || item.name || item.label || '').trim().toLowerCase().replace(/\s+/g, '-')
    const label = String(item.label || item.name || '').trim()
    const price = Number(item.price)
    if (!id || !label || !Number.isFinite(price) || price < 0) continue
    out.push({ id, label, price: Math.round(price) })
  }
  return out
}

const toIsoDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim()
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** FullCalendar day cells — use local calendar date, not UTC (avoids wrong-day highlights). */
const formatLocalYmd = (value) => {
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addOneCalendarDayYmd = (ymd) => {
  const [y, m, d] = String(ymd)
    .split('-')
    .map((x) => Number(x))
  const dt = new Date(y, m - 1, d)
  if (!Number.isFinite(dt.getTime())) return ''
  dt.setDate(dt.getDate() + 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Stay nights [check-in, check-out) — matches server occupancy expansion. */
const enumerateStayNights = (checkIn, checkOut) => {
  const a = String(checkIn || '').trim()
  const b = String(checkOut || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b) || b <= a) return []
  const nights = []
  let d = a
  while (d < b) {
    nights.push(d)
    d = addOneCalendarDayYmd(d)
    if (!d || nights.length > 400) break
  }
  return nights
}

const isNotApplicableStayDate = (dateStr, ctx) => {
  const s = String(dateStr || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return true
  if (s < ctx.todayYmd) return true
  if (ctx.whitelistMode && !ctx.availableSet.has(s)) return true
  return false
}

/** Earliest YYYY-MM-DD from start (inclusive) where isDisabled returns false. */
const findFirstOpenCheckInYmd = (startYmd, isDisabled) => {
  let d = String(startYmd || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return ''
  for (let i = 0; i < 400 && d; i++) {
    if (!isDisabled(d)) return d
    d = addOneCalendarDayYmd(d)
  }
  return ''
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Matches StayDatePickerField calendar icon; native time picker control stays clickable but hidden (WebKit). */
const stayTimeInputClassName =
  'relative w-full rounded-lg border border-[#ddd2c6] bg-white py-2.5 pl-3 pr-10 text-sm text-[#1f1f1f] outline-none focus:border-[#c9b6a3] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:z-[1] [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0'

const normalizeStayTime = (value) => {
  const raw = String(value || '').trim()
  if (/^\d{2}:\d{2}$/.test(raw)) return raw
  return '00:00'
}

const computeStayDays = (checkInDate, checkOutDate, checkInTime, checkOutTime) => {
  const inDate = String(checkInDate || '').trim()
  const outDate = String(checkOutDate || '').trim()
  if (!inDate || !outDate) return 1
  const inMs = Date.parse(`${inDate}T${normalizeStayTime(checkInTime)}:00`)
  const outMs = Date.parse(`${outDate}T${normalizeStayTime(checkOutTime)}:00`)
  if (!Number.isFinite(inMs) || !Number.isFinite(outMs)) return 1
  if (outMs <= inMs) return 1
  const diffDays = Math.ceil((outMs - inMs) / MS_PER_DAY)
  return Math.min(99, Math.max(1, diffDays))
}

const isStayCheckoutSpanOpen = (checkIn, checkOut, occupiedSet, notApplicableCtx) => {
  const ci = String(checkIn || '').trim()
  const co = String(checkOut || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ci) || !/^\d{4}-\d{2}-\d{2}$/.test(co) || co <= ci) return false
  const span = enumerateStayNights(ci, co)
  if (!span.length) return false
  for (const d of span) {
    if (occupiedSet.has(d)) return false
    if (notApplicableCtx.whitelistMode && !notApplicableCtx.availableSet.has(d)) return false
    if (isNotApplicableStayDate(d, notApplicableCtx)) return false
  }
  return true
}

const isDisplayedOccupiedStayDate = (dateStr, occupiedSet, todayYmd) =>
  occupiedSet.has(dateStr) && dateStr >= todayYmd

const buildStayRangeCellClasses = (dateStr, checkInDate, checkOutDate) => {
  const ci = String(checkInDate || '').trim()
  const co = String(checkOutDate || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ci)) return []

  const hasCo = /^\d{4}-\d{2}-\d{2}$/.test(co) && co > ci
  if (!hasCo) {
    return dateStr === ci ? ['tb-day-selected-start'] : []
  }

  if (dateStr < ci || dateStr > co) return []

  const classes = ['tb-day-in-range']
  if (dateStr === ci) classes.push('tb-day-selected-start')
  else if (dateStr === co) classes.push('tb-day-selected-end')

  return classes
}

const stayCalendarSkinClassName =
  'mt-3 rounded-xl border border-[#efe5db] bg-[#fcfaf7] p-3 [&_.fc]:text-[#2f2f2f] [&_.fc-theme-standard_.fc-scrollgrid]:border-[#e7dfd5] [&_.fc-theme-standard_td]:border-[#efe5db] [&_.fc-theme-standard_th]:border-[#efe5db] [&_.fc-col-header-cell]:bg-[#f8f5f0] [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:text-[#6f665d] [&_.fc-daygrid-day-frame]:relative [&_.fc-daygrid-day-frame]:min-h-14 [&_.fc-daygrid-day-top]:relative [&_.fc-daygrid-day-top]:z-[1] [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:text-[#6f665d] [&_.fc-day-today]:bg-transparent [&_.fc-day-today]:shadow-none [&_.fc-toolbar-title]:text-lg [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-[#2f2f2f] [&_.fc-toolbar.fc-header-toolbar]:mb-2 [&_.fc_.fc-button]:rounded-md [&_.fc_.fc-button]:px-2 [&_.fc_.fc-button]:py-1 [&_.fc_.fc-button]:text-xs [&_.fc_.fc-button]:font-medium [&_.fc_.fc-button]:shadow-none [&_.fc_.fc-button-primary:focus]:shadow-none [&_.fc-daygrid-event]:rounded-md [&_.fc-daygrid-event]:text-[10px] [&_.fc-daygrid-event]:leading-tight [&_.fc-daygrid-event]:text-white [&_.fc-daygrid-day.tb-day-not-applicable]:cursor-not-allowed [&_.fc-daygrid-day.tb-day-not-applicable]:bg-[#f4f4f5] [&_.fc-daygrid-day.tb-day-not-applicable_.fc-daygrid-day-number]:text-[#a1a1aa] [&_.fc-daygrid-day.tb-day-occupied]:cursor-not-allowed [&_.fc-daygrid-day.tb-day-occupied]:bg-[#ffe4e6] [&_.fc-daygrid-day.tb-day-occupied_.fc-daygrid-day-number]:text-[#9f1239] [&_.fc-daygrid-day.tb-day-in-range_.fc-daygrid-day-number]:font-bold [&_.fc-daygrid-day.tb-day-in-range_.fc-daygrid-day-number]:text-[#7d3f12] [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:relative [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:z-[2] [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:mx-auto [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:flex [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:h-8 [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:w-8 [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:items-center [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:justify-center [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:rounded-full [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:bg-[#ff7a1a] [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:text-white [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:shadow-[0_2px_4px_rgba(155,90,44,0.28)] [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:ring-2 [&_.fc-daygrid-day.tb-day-selected-start_.fc-daygrid-day-number]:ring-white/90 [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:relative [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:z-[2] [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:mx-auto [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:flex [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:h-8 [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:w-8 [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:items-center [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:justify-center [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:rounded-full [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:bg-[#ff7a1a] [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:text-white [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:shadow-[0_2px_4px_rgba(155,90,44,0.28)] [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:ring-2 [&_.fc-daygrid-day.tb-day-selected-end_.fc-daygrid-day-number]:ring-white/90]'

const deriveGuestLimit = (stayPackage) => {
  const directCandidates = [
    stayPackage?.maxGuests,
    stayPackage?.guestCapacity,
    stayPackage?.capacity,
    stayPackage?.maxOccupancy
  ]
  for (const candidate of directCandidates) {
    const n = Number(candidate)
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  const textCandidates = [
    stayPackage?.servingSize,
    stayPackage?.description,
    stayPackage?.capacityLabel
  ]
  for (const text of textCandidates) {
    const raw = String(text || '')
    const matched = raw.match(/(\d{1,3})/)
    if (!matched) continue
    const n = Number(matched[1])
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  return 10
}

const StayBooking = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const addItem = useTouristCartItemStore((s) => s.addItem)
  const stayPackage = location?.state?.stayPackage || null
  const stayBusiness = location?.state?.stayBusiness || null
  const touristName = String(user?.name || '').trim()
  const touristEmail = String(user?.email || '').trim()
  const touristPhone = String(user?.phone || user?.contact_info?.phone || '')
    .trim()
    .slice(0, STAY_BOOKING_PHONE_MAX_LENGTH)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: {
      checkInDate: '',
      checkInTime: '14:00',
      checkOutDate: '',
      checkOutTime: '12:00',
      guests: '2',
      fullName: touristName,
      email: touristEmail,
      phone: touristPhone,
      travelPurpose: '',
      withPets: 'NO',
      needParking: 'NO',
      addOnSelections: []
    }
  })

  const packageImage = useMemo(() => {
    if (!stayPackage) return ''
    return Array.isArray(stayPackage.images) && stayPackage.images.length ? stayPackage.images[0] : ''
  }, [stayPackage])
  const guestLimit = useMemo(() => deriveGuestLimit(stayPackage), [stayPackage])
  const guestOptions = useMemo(
    () => Array.from({ length: Math.max(1, guestLimit) }, (_, index) => String(index + 1)),
    [guestLimit]
  )
  const addOnCatalog = useMemo(
    () => normalizeStayAddOns(stayPackage?.addOns || stayPackage?.addons || stayPackage?.availableAddOns || stayBusiness?.addOns),
    [stayBusiness?.addOns, stayPackage?.addOns, stayPackage?.addons, stayPackage?.availableAddOns]
  )
  const selectedAddOns = useWatch({ control, name: 'addOnSelections' }) || []
  const checkInTime = useWatch({ control, name: 'checkInTime' })
  const checkOutTime = useWatch({ control, name: 'checkOutTime' })
  const selectedAddOnRows = useMemo(
    () => addOnCatalog.filter((row) => selectedAddOns.includes(row.id)),
    [addOnCatalog, selectedAddOns]
  )
  const selectedAddOnTotal = useMemo(
    () => selectedAddOnRows.reduce((sum, row) => sum + Number(row.price || 0), 0),
    [selectedAddOnRows]
  )
  const checkInDate = useWatch({ control, name: 'checkInDate' })
  const checkOutDate = useWatch({ control, name: 'checkOutDate' })
  const todayYmd = useMemo(() => formatLocalYmd(new Date()), [])
  const stayDays = useMemo(
    () => computeStayDays(checkInDate, checkOutDate, checkInTime, checkOutTime),
    [checkInDate, checkOutDate, checkInTime, checkOutTime]
  )
  const baseNightCost = useMemo(() => Math.max(0, Number(stayPackage?.price) || 0), [stayPackage?.price])
  const baseCoveredDays = 1
  const extraDays = Math.max(0, stayDays - baseCoveredDays)
  const extraDayTotal = extraDays * baseNightCost
  const stayBaseTotal = baseNightCost + extraDayTotal
  const bookingGrandTotal = stayBaseTotal + selectedAddOnTotal

  const occupiedDates = useMemo(() => {
    const fromPackage = Array.isArray(stayPackage?.occupiedDates) ? stayPackage.occupiedDates : []
    const fromUnavailable = Array.isArray(stayPackage?.unavailableDates) ? stayPackage.unavailableDates : []
    const merged = [...fromPackage, ...fromUnavailable].map(toIsoDate).filter(Boolean)
    return Array.from(new Set(merged))
  }, [stayPackage])

  const availableDates = useMemo(() => {
    const raw = Array.isArray(stayPackage?.availableDates) ? stayPackage.availableDates : []
    const normalized = raw.map(toIsoDate).filter(Boolean)
    return Array.from(new Set(normalized))
  }, [stayPackage])

  const occupiedSet = useMemo(() => new Set(occupiedDates), [occupiedDates])

  const notApplicableCtx = useMemo(
    () => ({
      todayYmd,
      whitelistMode: availableDates.length > 0,
      availableSet: new Set(availableDates)
    }),
    [todayYmd, availableDates]
  )

  const checkOutInputMin = useMemo(() => {
    const ci = String(checkInDate || '').trim()
    if (ci && /^\d{4}-\d{2}-\d{2}$/.test(ci)) {
      return addOneCalendarDayYmd(ci) || todayYmd
    }
    return addOneCalendarDayYmd(todayYmd) || todayYmd
  }, [checkInDate, todayYmd])

  const calendarEvents = useMemo(() => {
    const occupiedEvents = occupiedDates
      .filter((date) => isDisplayedOccupiedStayDate(date, occupiedSet, todayYmd))
      .map((date) => ({
        id: `occ-${date}`,
        title: 'Occupied',
        date,
        color: '#e11d48'
      }))
    const availableEvents = availableDates
      .filter(
        (date) =>
          !occupiedSet.has(date) && !isNotApplicableStayDate(date, notApplicableCtx)
      )
      .map((date) => ({
        id: `avail-${date}`,
        title: 'Available',
        date,
        color: '#059669'
      }))
    return [...availableEvents, ...occupiedEvents]
  }, [availableDates, occupiedDates, occupiedSet, notApplicableCtx, todayYmd])

  const isCheckInPickerDisabled = useCallback(
    (ymd) => occupiedSet.has(ymd) || isNotApplicableStayDate(ymd, notApplicableCtx),
    [occupiedSet, notApplicableCtx]
  )

  const isCheckOutPickerDisabled = useCallback(
    (ymd) => {
      if (ymd < checkOutInputMin) return true
      const ci = String(checkInDate || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ci)) return ymd < checkOutInputMin
      if (ymd <= ci) return true
      const span = enumerateStayNights(ci, ymd)
      if (!span.length) return true
      for (const d of span) {
        if (occupiedSet.has(d)) return true
        if (notApplicableCtx.whitelistMode && !notApplicableCtx.availableSet.has(d)) return true
        if (isNotApplicableStayDate(d, notApplicableCtx)) return true
      }
      return false
    },
    [checkInDate, checkOutInputMin, occupiedSet, notApplicableCtx]
  )

  const checkOutPickerVisual = useCallback(
    (ymd) => {
      const ci = String(checkInDate || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ci) || ymd <= ci) return 'blocked'
      const span = enumerateStayNights(ci, ymd)
      if (span.some((d) => isDisplayedOccupiedStayDate(d, occupiedSet, todayYmd))) return 'occupied'
      return 'blocked'
    },
    [checkInDate, occupiedSet, todayYmd]
  )

  const stayCalendarRef = useRef(null)
  const didPrimeFirstCheckInRef = useRef(false)
  const lastStayPackageIdRef = useRef('')
  const selectionClearedRef = useRef(false)

  const handleCalendarDateSelect = useCallback(
    (dateStr) => {
      if (isDisplayedOccupiedStayDate(dateStr, occupiedSet, todayYmd)) return
      if (isNotApplicableStayDate(dateStr, notApplicableCtx)) return

      selectionClearedRef.current = false

      const ci = String(checkInDate || '').trim()
      const co = String(checkOutDate || '').trim()
      const hasCi = /^\d{4}-\d{2}-\d{2}$/.test(ci)
      const hasCo = /^\d{4}-\d{2}-\d{2}$/.test(co) && co > ci

      const commitCheckIn = (nextCheckIn) => {
        setValue('checkInDate', nextCheckIn, { shouldDirty: true })
        const nextCo = String(getValues('checkOutDate') || '').trim()
        if (
          nextCo &&
          /^\d{4}-\d{2}-\d{2}$/.test(nextCo) &&
          !isStayCheckoutSpanOpen(nextCheckIn, nextCo, occupiedSet, notApplicableCtx)
        ) {
          setValue('checkOutDate', '', { shouldDirty: true })
        }
      }

      if (!hasCi) {
        commitCheckIn(dateStr)
        return
      }

      if (!hasCo) {
        if (dateStr === ci) return
        if (dateStr > ci && isStayCheckoutSpanOpen(ci, dateStr, occupiedSet, notApplicableCtx)) {
          setValue('checkOutDate', dateStr, { shouldDirty: true })
          return
        }
        if (dateStr < ci) {
          commitCheckIn(dateStr)
          return
        }
        commitCheckIn(dateStr)
        return
      }

      if (dateStr > co && isStayCheckoutSpanOpen(ci, dateStr, occupiedSet, notApplicableCtx)) {
        setValue('checkOutDate', dateStr, { shouldDirty: true })
        return
      }
      if (dateStr > ci && dateStr < co) {
        commitCheckIn(dateStr)
        return
      }
      if (dateStr < ci) {
        commitCheckIn(dateStr)
        return
      }
      if (dateStr === ci || dateStr === co) return
      if (dateStr > ci && isStayCheckoutSpanOpen(ci, dateStr, occupiedSet, notApplicableCtx)) {
        setValue('checkOutDate', dateStr, { shouldDirty: true })
        return
      }
      commitCheckIn(dateStr)
    },
    [checkInDate, checkOutDate, getValues, notApplicableCtx, occupiedSet, setValue, todayYmd]
  )

  const handleClearStaySelection = useCallback(() => {
    selectionClearedRef.current = true
    setValue('checkInDate', '', { shouldDirty: true })
    setValue('checkOutDate', '', { shouldDirty: true })
    requestAnimationFrame(() => {
      const api = stayCalendarRef.current?.getApi?.()
      if (api) api.gotoDate(todayYmd)
    })
  }, [setValue, todayYmd])

  const handleCheckInDateFieldChange = useCallback(
    (ymd) => {
      if (!ymd) {
        handleClearStaySelection()
        return
      }
      handleCalendarDateSelect(ymd)
    },
    [handleCalendarDateSelect, handleClearStaySelection]
  )

  const handleCheckOutDateFieldChange = useCallback(
    (ymd) => {
      if (!ymd) {
        setValue('checkOutDate', '', { shouldDirty: true })
        return
      }
      const ci = String(checkInDate || '').trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(ci) && ymd > ci && isStayCheckoutSpanOpen(ci, ymd, occupiedSet, notApplicableCtx)) {
        selectionClearedRef.current = false
        setValue('checkOutDate', ymd, { shouldDirty: true })
        return
      }
      handleCalendarDateSelect(ymd)
    },
    [checkInDate, handleCalendarDateSelect, notApplicableCtx, occupiedSet, setValue]
  )

  /** Default check-in to the first bookable day; check-out stays empty until the guest picks it. */
  useEffect(() => {
    if (!stayPackage || !stayBusiness) return
    if (selectionClearedRef.current) return
    const sid = String(stayPackage.id || '')
    if (sid !== lastStayPackageIdRef.current) {
      lastStayPackageIdRef.current = sid
      didPrimeFirstCheckInRef.current = false
      selectionClearedRef.current = false
    }
    if (didPrimeFirstCheckInRef.current) return

    const current = String(getValues('checkInDate') || '').trim()
    const currentOk =
      current &&
      /^\d{4}-\d{2}-\d{2}$/.test(current) &&
      !isCheckInPickerDisabled(current)

    const scrollTo = (ymd) => {
      requestAnimationFrame(() => {
        const api = stayCalendarRef.current?.getApi?.()
        if (api && ymd) api.gotoDate(ymd)
      })
    }

    if (currentOk) {
      didPrimeFirstCheckInRef.current = true
      scrollTo(current)
      return
    }

    const found = findFirstOpenCheckInYmd(todayYmd, isCheckInPickerDisabled)
    if (found) {
      setValue('checkInDate', found, { shouldDirty: false })
      setValue('checkOutDate', '', { shouldDirty: false })
      scrollTo(found)
    }
    didPrimeFirstCheckInRef.current = true
  }, [
    stayPackage,
    stayBusiness,
    todayYmd,
    isCheckInPickerDisabled,
    getValues,
    setValue
  ])

  useEffect(() => {
    if (touristName && !String(getValues('fullName') || '').trim()) {
      setValue('fullName', touristName, { shouldDirty: false })
    }
    if (touristEmail && !String(getValues('email') || '').trim()) {
      setValue('email', touristEmail, { shouldDirty: false })
    }
    if (touristPhone && !String(getValues('phone') || '').trim()) {
      setValue('phone', touristPhone, { shouldDirty: false })
    }
  }, [touristName, touristEmail, touristPhone, getValues, setValue])

  useEffect(() => {
    const current = Number(getValues('guests') || 1)
    if (!Number.isFinite(current) || current < 1) {
      setValue('guests', '1', { shouldDirty: false })
      return
    }
    if (current > guestLimit) {
      setValue('guests', String(guestLimit), { shouldDirty: false })
    }
  }, [guestLimit, getValues, setValue])

  /** Drop check-out when check-in is cleared or the saved range is no longer valid. */
  useEffect(() => {
    const ci = String(checkInDate || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ci)) {
      if (String(getValues('checkOutDate') || '').trim()) {
        setValue('checkOutDate', '', { shouldDirty: true })
      }
      return
    }

    const co = String(getValues('checkOutDate') || '').trim()
    if (!co) return
    if (!isStayCheckoutSpanOpen(ci, co, occupiedSet, notApplicableCtx)) {
      setValue('checkOutDate', '', { shouldDirty: true })
    }
  }, [checkInDate, getValues, notApplicableCtx, occupiedSet, setValue])

  useEffect(() => {
    const target = String(checkInDate || checkOutDate || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) return
    requestAnimationFrame(() => {
      const api = stayCalendarRef.current?.getApi?.()
      if (api) api.gotoDate(target)
    })
  }, [checkInDate, checkOutDate])

  if (!stayPackage || !stayBusiness) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#e7dfd5] bg-white p-8 text-center shadow-sm md:p-10">
        <h1 className="text-lg font-semibold text-[#1f1f1f]">No selected stay package</h1>
        <p className="mt-2 text-sm text-[#5b5b5b]">Choose a resort package from Explore first, then tap Book now.</p>
        <button
          type="button"
          onClick={() => navigate(touristExploreHref)}
          className="mt-6 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  const onSubmit = async (values) => {
    const phone = String(values.phone || '').trim()
    if (phone.length > STAY_BOOKING_PHONE_MAX_LENGTH) {
      toast.error(`Phone number must be at most ${STAY_BOOKING_PHONE_MAX_LENGTH} characters.`)
      return
    }

    const nights = computeStayDays(
      values.checkInDate,
      values.checkOutDate,
      values.checkInTime,
      values.checkOutTime
    )
    const parsedCheckInDate = Date.parse(`${String(values.checkInDate || '').trim()}T00:00:00`)
    const parsedCheckOutDate = Date.parse(`${String(values.checkOutDate || '').trim()}T00:00:00`)
    if (!Number.isFinite(parsedCheckInDate) || !Number.isFinite(parsedCheckOutDate)) {
      toast.error('Please provide valid check-in and check-out dates.')
      return
    }
    if (parsedCheckOutDate <= parsedCheckInDate) {
      toast.error('Check-out date must be after check-in date.')
      return
    }

    const stayNights = enumerateStayNights(values.checkInDate, values.checkOutDate)
    if (!stayNights.length) {
      toast.error('Please provide a valid stay date range.')
      return
    }
    for (const d of stayNights) {
      if (occupiedSet.has(d)) {
        toast.error('Those dates overlap nights that are already booked for this stay. Adjust your schedule.')
        return
      }
      if (notApplicableCtx.whitelistMode && !notApplicableCtx.availableSet.has(d)) {
        toast.error('Your stay includes dates that are not open for booking for this package.')
        return
      }
      if (isNotApplicableStayDate(d, notApplicableCtx)) {
        toast.error('Your stay includes dates that are not available to book.')
        return
      }
    }

    const baseCost = baseNightCost
    const overDayCount = Math.max(0, nights - 1)
    const overDayCost = overDayCount * baseNightCost
    const estimatedTotal = baseCost + overDayCost + selectedAddOnTotal

    const bookingNotes = [
      `Check-in: ${values.checkInDate} ${values.checkInTime}`,
      `Check-out: ${values.checkOutDate} ${values.checkOutTime}`,
      `Total stay days: ${nights}`,
      `Base cost (1 day): ${formatPrice(baseCost)}`,
      `Extra days: ${overDayCount} × ${formatPrice(baseNightCost)} = ${formatPrice(overDayCost)}`,
      `Guests: ${values.guests}`,
      `Guest name: ${values.fullName}`,
      `Email: ${values.email}`,
      phone ? `Phone: ${phone}` : '',
      values.travelPurpose ? `Purpose: ${values.travelPurpose}` : '',
      `With pets: ${values.withPets}`,
      `Need parking: ${values.needParking}`,
      selectedAddOnRows.length
        ? `Add-ons: ${selectedAddOnRows
            .map((row) => `${row.label} (+${formatPrice(row.price)})`)
            .join(', ')}`
        : 'Add-ons: None selected',
      selectedAddOnRows.length ? `Add-ons total: ${formatPrice(selectedAddOnTotal)}` : '',
      `Estimated total: ${formatPrice(estimatedTotal)}`
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await postTouristCustomerOrder(String(stayPackage.businessId || ''), {
        customerName: values.fullName,
        customerPhone: phone,
        billingType: 'PAY_AT_PICKUP',
        orderType: 'BOOKING_REQUEST',
        notes: bookingNotes,
        lines: [
          {
            menuItemId: String(stayPackage.id || ''),
            quantity: nights,
            notes: bookingNotes
          }
        ]
      })
      addItem(
        {
          businessId: String(stayPackage.businessId || ''),
          businessName: stayPackage.businessName || stayBusiness?.name || 'Resort',
          catalogItemId: String(stayPackage.id || ''),
          name: stayPackage.name || 'Stay package',
          unitPrice: baseNightCost,
          image: packageImage,
          qty: nights,
          listingType: 'STAY',
          itemNotes: bookingNotes,
          ...pickCartItemDetailsFromMenuItem(stayPackage)
        },
        { silent: true }
      )
      toast.success('Booking request sent. Waiting for resort approval.')
      navigate(touristOrdersHref)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not submit booking request.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Book now</p>
        <h1 className="mt-1 text-xl font-semibold text-[#1f1f1f] md:text-2xl">Stay booking details</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">Tell us your schedule and booking preferences before checkout.</p>
      </div>

      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-24 w-full overflow-hidden rounded-xl bg-[#ece3d9] sm:h-20 sm:w-28">
            {packageImage ? <img src={packageImage} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-[#1f1f1f]">{stayPackage.name}</p>
            <p className="text-xs text-[#5b5b5b]">{stayPackage.businessName || stayBusiness?.name}</p>
            <p className="mt-1 text-sm font-semibold text-[#ff7a1a]">{formatPrice(stayPackage.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(buildTouristExploreBusinessDetailHref(stayPackage.businessId))}
            className="rounded-full border border-[#e7dfd5] px-3 py-1.5 text-xs font-semibold text-[#7d5b3b] transition hover:border-[#d4c4b6] sm:ml-auto"
          >
            View resort
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Availability calendar</p>
            <h2 className="mt-1 text-base font-semibold text-[#1f1f1f]">Choose your stay dates</h2>
            <p className="mt-1 text-xs text-[#6b6b6b]">
              Mark check-in and check-out on the calendar below. Applicable booking hours: Check-in from{' '}
              <span className="font-semibold text-[#7d5b3b]">{checkInTime || '14:00'}</span>, check-out by{' '}
              <span className="font-semibold text-[#7d5b3b]">{checkOutTime || '12:00'}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearStaySelection}
            disabled={!checkInDate && !checkOutDate}
            className="shrink-0 rounded-full border border-[#e7dfd5] bg-white px-3 py-1.5 text-xs font-semibold text-[#7d5b3b] transition hover:border-[#d4c4b6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear selection
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#5b5b5b]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#059669]" />
              Available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48]" />
              Occupied
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a1a]" />
              Check-in / check-out
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#7d3f12]">15</span>
              Your stay
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
              Not applicable
            </span>
        </div>
        <div
          className={stayCalendarSkinClassName}
          style={{
            '--fc-button-bg-color': '#f5eee4',
            '--fc-button-border-color': '#d5c5b2',
            '--fc-button-text-color': '#6f665d',
            '--fc-button-hover-bg-color': '#f0e7db',
            '--fc-button-hover-border-color': '#c7b39d',
            '--fc-button-active-bg-color': '#f2e8da',
            '--fc-button-active-border-color': '#9b5a2c',
            '--fc-button-active-text-color': '#9b5a2c',
            '--fc-today-bg-color': 'transparent'
          }}
        >
          <FullCalendar
            ref={stayCalendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            dateClick={(info) => handleCalendarDateSelect(info.dateStr)}
            eventClick={(info) => handleCalendarDateSelect(info.event.startStr.slice(0, 10))}
            dayCellClassNames={(arg) => {
              const dateStr = formatLocalYmd(arg.date)
              if (isDisplayedOccupiedStayDate(dateStr, occupiedSet, todayYmd)) return ['tb-day-occupied']
              if (isNotApplicableStayDate(dateStr, notApplicableCtx)) return ['tb-day-not-applicable']
              return buildStayRangeCellClasses(dateStr, checkInDate, checkOutDate)
            }}
            height="auto"
            aspectRatio={2.3}
            fixedWeekCount={false}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            dayMaxEvents={2}
          />
        </div>
        <p className="mt-2 text-xs text-[#6b6b6b]">
          The first open day is marked as check-in by default. Tap a later open day to set check-out, then tap another
          open day between check-in and check-out to move check-in forward. Nights between your dates are highlighted and
          the estimated total updates with your check-in and check-out times below. Clear selection resets the range.
          Gray days are not bookable; red days are already booked. The date fields follow the same rules.
        </p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Check-in date</span>
            <Controller
              name="checkInDate"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <StayDatePickerField
                  id="stay-check-in-date"
                  value={field.value || ''}
                  onChange={handleCheckInDateFieldChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  minYmd={todayYmd}
                  todayYmd={todayYmd}
                  isDateDisabled={isCheckInPickerDisabled}
                  getDisabledVisual={(ymd) =>
                    isDisplayedOccupiedStayDate(ymd, occupiedSet, todayYmd) ? 'occupied' : 'blocked'
                  }
                />
              )}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Check-in time</span>
            <div className="relative">
              <input type="time" required {...register('checkInTime')} className={stayTimeInputClassName} />
              <FiClock
                className="pointer-events-none absolute right-3 top-1/2 z-0 h-4 w-4 -translate-y-1/2 text-[#7d5b3b]"
                aria-hidden
              />
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Check-out date</span>
            <Controller
              name="checkOutDate"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <StayDatePickerField
                  id="stay-check-out-date"
                  value={field.value || ''}
                  onChange={handleCheckOutDateFieldChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  minYmd={checkOutInputMin}
                  todayYmd={todayYmd}
                  isDateDisabled={isCheckOutPickerDisabled}
                  getDisabledVisual={checkOutPickerVisual}
                />
              )}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Check-out time</span>
            <div className="relative">
              <input type="time" required {...register('checkOutTime')} className={stayTimeInputClassName} />
              <FiClock
                className="pointer-events-none absolute right-3 top-1/2 z-0 h-4 w-4 -translate-y-1/2 text-[#7d5b3b]"
                aria-hidden
              />
            </div>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Number of guests</span>
            <select
              {...register('guests')}
              className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]"
            >
              {guestOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6b6b6b]">Maximum for this stay: {guestLimit} guest{guestLimit === 1 ? '' : 's'}</p>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Purpose of stay</span>
            <input type="text" placeholder="Vacation, family trip, etc." {...register('travelPurpose')} className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Full name</span>
            <input type="text" required {...register('fullName')} className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Email</span>
            <input type="email" required {...register('email')} className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Phone number</span>
            <input
              type="tel"
              inputMode="tel"
              maxLength={STAY_BOOKING_PHONE_MAX_LENGTH}
              placeholder="Optional"
              {...register('phone', {
                maxLength: {
                  value: STAY_BOOKING_PHONE_MAX_LENGTH,
                  message: `Phone number must be at most ${STAY_BOOKING_PHONE_MAX_LENGTH} characters`
                }
              })}
              className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]"
            />
            {errors.phone ? (
              <p className="text-xs text-[#b42318]" role="alert">
                {errors.phone.message}
              </p>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Bringing pets?</span>
            <select {...register('withPets')} className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]">
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Need parking slot?</span>
            <select {...register('needParking')} className="w-full rounded-lg border border-[#ddd2c6] px-3 py-2.5 text-sm outline-none focus:border-[#c9b6a3]">
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </label>
        </div>

        <div className="space-y-2 rounded-xl border border-[#e8dfd6] bg-[#fcfaf7] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Price breakdown</p>
          <div className="space-y-1 text-sm text-[#3f3f3f]">
            <p className="flex items-center justify-between gap-3">
              <span>Base cost (first day)</span>
              <span className="font-semibold text-[#7d5b3b]">{formatPrice(baseNightCost)}</span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span>Extra days ({extraDays} x {formatPrice(baseNightCost)})</span>
              <span className="font-semibold text-[#7d5b3b]">{formatPrice(extraDayTotal)}</span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span>Stay subtotal ({stayDays} day{stayDays === 1 ? '' : 's'})</span>
              <span className="font-semibold text-[#7d5b3b]">{formatPrice(stayBaseTotal)}</span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span>Add-ons</span>
              <span className="font-semibold text-[#7d5b3b]">{formatPrice(selectedAddOnTotal)}</span>
            </p>
            <p className="flex items-center justify-between gap-3 border-t border-[#e8dfd6] pt-2 text-base">
              <span className="font-semibold text-[#1f1f1f]">Estimated total</span>
              <span className="font-semibold text-[#ff7a1a]">{formatPrice(bookingGrandTotal)}</span>
            </p>
          </div>
          <p className="text-[11px] text-[#6b6b6b]">
            Base cost covers the first day. Every additional day adds another {formatPrice(baseNightCost)}. Day count
            follows your selected dates and check-in/check-out times.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7a7a7a]">Add-ons</span>
            <span className="text-xs font-semibold text-[#9b5a2c]">
              Selected total: {formatPrice(selectedAddOnTotal)}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOnCatalog.map((row) => (
              <label
                key={row.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ddd2c6] bg-[#fcfaf7] px-3 py-2.5"
              >
                <span className="inline-flex items-center gap-2 text-sm text-[#1f1f1f]">
                  <input type="checkbox" value={row.id} {...register('addOnSelections')} className="h-4 w-4 accent-[#ff7a1a]" />
                  {row.label}
                </span>
                <span className="text-xs font-semibold text-[#9b5a2c]">+{formatPrice(row.price)}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-[#6b6b6b]">
            Add-ons are optional extras. Final charge confirmation is handled by the resort during booking confirmation.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#efe6dc] pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-xs font-semibold text-[#5b5b5b] transition hover:border-[#d4c4b6] sm:text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            className="rounded-full bg-[#ff7a1a] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#eb6c12] sm:text-sm"
          >
            Request booking
          </button>
        </div>
      </form>
    </div>
  )
}

export default StayBooking
