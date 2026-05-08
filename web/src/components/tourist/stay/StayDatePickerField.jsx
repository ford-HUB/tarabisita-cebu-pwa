import { useEffect, useId, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { FiCalendar } from 'react-icons/fi'

const WEEK_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const buildMonthCells = (viewMonth) => {
  const first = viewMonth.startOf('month')
  const pad = first.day()
  const dim = viewMonth.daysInMonth()
  const cells = []
  for (let i = pad; i > 0; i--) {
    const d = first.subtract(i, 'day')
    cells.push({ ymd: d.format('YYYY-MM-DD'), inMonth: false })
  }
  for (let day = 1; day <= dim; day++) {
    cells.push({ ymd: first.date(day).format('YYYY-MM-DD'), inMonth: true })
  }
  const tail = (7 - (cells.length % 7)) % 7
  let last = first.date(dim)
  for (let i = 0; i < tail; i++) {
    last = last.add(1, 'day')
    cells.push({ ymd: last.format('YYYY-MM-DD'), inMonth: false })
  }
  return cells
}

/**
 * Replaces &lt;input type="date" /&gt; so individual nights can be disabled (occupied / not applicable).
 * Value is always YYYY-MM-DD for the form.
 */
const StayDatePickerField = ({
  id: idProp,
  value,
  onChange,
  onBlur,
  inputRef,
  minYmd,
  isDateDisabled,
  getDisabledVisual,
  placeholder = 'mm/dd/yyyy',
  todayYmd
}) => {
  const autoId = useId()
  const id = idProp || autoId
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const minDay = useMemo(() => (minYmd && /^\d{4}-\d{2}-\d{2}$/.test(minYmd) ? dayjs(`${minYmd}T12:00:00`) : null), [minYmd])

  const [viewMonth, setViewMonth] = useState(() =>
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? dayjs(`${value}T12:00:00`).startOf('month')
      : minDay?.isValid()
        ? minDay.startOf('month')
        : dayjs().startOf('month')
  )

  const togglePanel = () => {
    if (open) {
      setOpen(false)
      onBlur?.()
      return
    }
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setViewMonth(dayjs(`${value}T12:00:00`).startOf('month'))
    } else if (minDay?.isValid()) {
      setViewMonth(minDay.startOf('month'))
    } else {
      setViewMonth(dayjs().startOf('month'))
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      const el = wrapRef.current
      if (el && !el.contains(e.target)) {
        setOpen(false)
        onBlur?.()
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onBlur])

  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth])

  const canPrevMonth = minDay?.isValid() ? viewMonth.isAfter(minDay.startOf('month'), 'month') : true

  const displayText =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dayjs(`${value}T12:00:00`).format('MM/DD/YYYY') : ''

  const pickDay = (ymd) => {
    if (minDay?.isValid() && ymd < minYmd) return
    if (isDateDisabled(ymd)) return
    onChange(ymd)
    setOpen(false)
    onBlur?.()
  }

  const onClear = () => {
    onChange('')
    setOpen(false)
    onBlur?.()
  }

  const onPickToday = () => {
    const t =
      todayYmd && /^\d{4}-\d{2}-\d{2}$/.test(todayYmd) ? todayYmd : dayjs().format('YYYY-MM-DD')
    if (minDay?.isValid() && t < minYmd) return
    if (isDateDisabled(t)) return
    onChange(t)
    setOpen(false)
    onBlur?.()
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        ref={inputRef}
        onClick={togglePanel}
        className="flex w-full items-center gap-2 rounded-lg border border-[#ddd2c6] bg-white px-3 py-2.5 text-left text-sm outline-none transition focus:border-[#c9b6a3]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`min-w-0 flex-1 truncate ${displayText ? 'text-[#1f1f1f]' : 'text-[#9ca3af]'}`}>
          {displayText || placeholder}
        </span>
        <FiCalendar className="h-4 w-4 shrink-0 text-[#7d5b3b]" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,320px)] rounded-xl border border-[#e7dfd5] bg-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canPrevMonth}
              onClick={() => canPrevMonth && setViewMonth((m) => m.subtract(1, 'month'))}
              className="rounded-md border border-[#e7dfd5] px-2 py-1 text-xs font-semibold text-[#5b5b5b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-[#1f1f1f]">{viewMonth.format('MMMM YYYY')}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => m.add(1, 'month'))}
              className="rounded-md border border-[#e7dfd5] px-2 py-1 text-xs font-semibold text-[#5b5b5b]"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#8a7f74]">
            {WEEK_LABELS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map(({ ymd, inMonth }, idx) => {
              const beforeMin = Boolean(minDay?.isValid() && ymd < minYmd)
              const outside = !inMonth
              const disabledByRule = inMonth && !beforeMin && isDateDisabled(ymd)
              const disabled = outside || beforeMin || disabledByRule
              let visual = null
              if (disabled && inMonth) {
                visual = beforeMin ? 'blocked' : getDisabledVisual?.(ymd) || 'blocked'
              }
              const selected = value === ymd
              const isToday = todayYmd && ymd === todayYmd

              let cellClass =
                'flex h-9 items-center justify-center rounded-md text-xs font-medium transition select-none'
              if (outside) {
                cellClass += ' cursor-default text-[#d1d5db]'
              } else if (disabled) {
                if (visual === 'occupied') {
                  cellClass +=
                    ' cursor-not-allowed bg-[#ffe4e6] text-[#9f1239] line-through decoration-[#be123c]/70'
                } else {
                  cellClass += ' cursor-not-allowed bg-[#f4f4f5] text-[#a1a1aa]'
                }
              } else {
                cellClass += ' cursor-pointer text-[#374151] hover:bg-[#f5eee4]'
              }
              if (selected && inMonth && !disabled) {
                cellClass += ' bg-[#ffedd5] font-semibold text-[#9a3412] ring-1 ring-[#fb923c]/60'
              } else if (isToday && inMonth && !disabled && !selected) {
                cellClass += ' ring-1 ring-[#ff7a1a]/40'
              }

              return (
                <button
                  key={`${idx}-${ymd}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && pickDay(ymd)}
                  className={cellClass}
                >
                  {dayjs(`${ymd}T12:00:00`).date()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex justify-between gap-2 border-t border-[#efe5db] pt-2">
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-[#7d5b3b] underline-offset-2 hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onPickToday}
              disabled={(() => {
                const t =
                  todayYmd && /^\d{4}-\d{2}-\d{2}$/.test(todayYmd)
                    ? todayYmd
                    : dayjs().format('YYYY-MM-DD')
                if (minDay?.isValid() && t < minYmd) return true
                return isDateDisabled(t)
              })()}
              className="text-xs font-semibold text-[#7d5b3b] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default StayDatePickerField
