import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import {
  getTrendingSearchChips,
  rankCatalogSearchSuggestions
} from '../../../shared/utils/touristSearchSuggestions.utils.js'

/**
 * Catalog search with floating suggestions verified against the same match rules as results.
 *
 * @param {{
 *   value: string,
 *   onChange: (next: string) => void,
 *   onSearch: (query: string) => void,
 *   catalogItems: unknown[],
 *   variant?: 'hero' | 'page',
 *   placeholder?: string,
 *   inputName?: string,
 *   disabled?: boolean,
 *   'aria-label'?: string
 * }} props
 */
const TouristCatalogSearchField = (props) => {
  const {
    value,
    onChange,
    onSearch,
    catalogItems,
    variant = 'page',
    placeholder = 'Search catalog…',
    inputName = 'catalog-search',
    disabled = false,
    'aria-label': ariaLabel = 'Search catalog'
  } = props

  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)

  const isHero = variant === 'hero'

  const suggestions = useMemo(
    () => rankCatalogSearchSuggestions(value, catalogItems, { limit: 8, minQueryLength: 1 }),
    [value, catalogItems]
  )

  const chips = useMemo(() => getTrendingSearchChips(catalogItems, { limit: 6 }), [catalogItems])

  const listItems = useMemo(() => {
    const q = String(value || '').trim()
    if (q.length < 1) return []
    return suggestions.map((label) => ({ type: 'suggestion', label }))
  }, [value, suggestions])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      const el = wrapRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      setOpen(false)
      onSearch(String(value || '').trim())
    },
    [onSearch, value]
  )

  const panelBase =
    'absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-[min(60vh,20rem)] overflow-y-auto rounded-2xl border shadow-2xl backdrop-blur-xl'

  const panelTheme = isHero
    ? 'border-white/25 bg-[#0f141c]/92 text-white'
    : 'border-[#e7dfd5] bg-white/98 text-[#1f1f1f]'

  const rowTheme = isHero
    ? 'text-left text-sm text-white hover:bg-white/10'
    : 'text-left text-sm text-[#1f1f1f] hover:bg-[#f8f5f0]'

  const hintTheme = isHero ? 'text-white/50' : 'text-[#6b6b6b]'

  const showPanel = open && !disabled && listItems.length > 0

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search" aria-label={ariaLabel}>
        <div
          className={
            isHero
              ? 'flex items-center gap-2 rounded-full border border-white/25 bg-white/18 py-1.5 pl-3 pr-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:gap-3 sm:pl-4 sm:pr-2'
              : 'flex items-center gap-2 rounded-full border border-[#e7dfd5] bg-[#fbf9f6] py-1.5 pl-3 pr-1.5 shadow-sm sm:gap-3 sm:pl-4 sm:pr-2'
          }
        >
          <FiSearch
            className={
              isHero
                ? 'h-5 w-5 shrink-0 text-white/90 sm:h-[1.35rem] sm:w-[1.35rem]'
                : 'h-5 w-5 shrink-0 text-[#9b5a2c] sm:h-[1.35rem] sm:w-[1.35rem]'
            }
            aria-hidden
          />
          <input
            type="search"
            name={inputName}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder={placeholder}
            className={
              isHero
                ? 'min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/55 sm:text-[0.9375rem]'
                : 'min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#1f1f1f] outline-none placeholder:text-[#8a8a8a] sm:text-[0.9375rem]'
            }
            autoComplete="off"
            enterKeyHint="search"
            aria-autocomplete="list"
            aria-expanded={showPanel}
            aria-controls={showPanel ? `${inputName}-suggestions` : undefined}
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12] sm:px-6"
          >
            Explore
          </button>
        </div>
      </form>

      {showPanel ? (
        <div
          id={`${inputName}-suggestions`}
          role="listbox"
          aria-label="Search suggestions"
          className={`${panelBase} ${panelTheme}`}
        >
          <p className={`border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${hintTheme} ${isHero ? 'border-white/10' : 'border-[#eee]'}`}>
            Smart matches — verified against your catalog
          </p>
          <ul className="list-none p-1">
            {listItems.map((row) => (
              <li key={`${row.type}-${row.label}`} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 ${rowTheme}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(row.label)
                    setOpen(false)
                    onSearch(String(row.label || '').trim())
                  }}
                >
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isHero ? 'bg-white/15 text-white/90' : 'bg-[#f5eee4] text-[#9b5a2c]'}`}
                  >
                    Match
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">{row.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c)
                setOpen(false)
                onSearch(String(c || '').trim())
              }}
              className={
                isHero
                  ? 'rounded-full border border-white/30 bg-white/12 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20'
                  : 'rounded-full border border-[#e7dfd5] bg-white px-3 py-1 text-xs font-medium text-[#5b5b5b] transition hover:border-[#ff7a1a] hover:text-[#9b5a2c]'
              }
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default TouristCatalogSearchField
