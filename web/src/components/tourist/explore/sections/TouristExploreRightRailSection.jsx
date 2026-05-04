import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiChevronDown,
  FiChevronUp,
  FiChevronsLeft,
  FiChevronsRight,
  FiCoffee,
  FiHome,
  FiMap,
  FiShoppingBag,
  FiTruck
} from 'react-icons/fi'
import { touristOrdersHref } from '../../../layout/tourist/touristLayout.constants'
import TouristCategoryChipsSection from './TouristCategoryChipsSection'

const intentIcon = (id) => {
  switch (id) {
    case 'INTENT_FOOD':
      return FiCoffee
    case 'INTENT_STAY':
      return FiHome
    case 'INTENT_RENTAL':
      return FiTruck
    case 'INTENT_EXPERIENCES':
      return FiMap
    default:
      return FiMap
  }
}

const foodTypeLabel = (value) => {
  if (!value || value === 'ALL') return 'All types'
  return value
}

const TouristExploreRightRailSection = ({
  intents,
  highlightIntentId,
  allPartnersActive,
  onSelectIntent,
  filterChips,
  categoryFilter,
  onSelectChip,
  showPartnerTypeChips,
  isCollapsed,
  onToggleCollapsed,
  foodMenuCategory,
  onFoodMenuCategoryChange,
  foodMenuCategories,
  foodMenuCategoriesLoading
}) => {
  const [foodTypesOpen, setFoodTypesOpen] = useState(false)

  useEffect(() => {
    if (categoryFilter !== 'INTENT_FOOD') setFoodTypesOpen(false)
  }, [categoryFilter])

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-[#e7dfd5] bg-white py-5 shadow-sm transition hover:border-[#d4c4b6] hover:bg-[#faf8f5]"
        aria-expanded="false"
        aria-label="Show filters and shortcuts"
        title="Show filters"
      >
        <FiChevronsLeft className="h-5 w-5 shrink-0 text-[#9b5a2c]" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#a79a8b] [writing-mode:vertical-rl]">
          Filters
        </span>
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#ece3d9] bg-[#faf8f5] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Shortcuts</p>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-lg p-1.5 text-[#5b5b5b] transition hover:bg-white hover:text-[#9b5a2c]"
          aria-expanded="true"
          aria-label="Minimize filters sidebar"
          title="Minimize sidebar"
        >
          <FiChevronsRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Goals</p>
        <nav className="mt-2.5 space-y-1" aria-label="Browse by goal">
          <button
            type="button"
            onClick={() => onSelectIntent('ALL')}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
              allPartnersActive
                ? 'border-[#ff7a1a] bg-[#fff8f2] text-[#9b5a2c]'
                : 'border-transparent bg-[#f8f5f0] text-[#1f1f1f] hover:border-[#e7dfd5]'
            }`}
          >
            <span>All partners</span>
            <span className="text-[10px] font-normal text-[#5b5b5b]">Reset</span>
          </button>
          {intents.map((intent) => {
            const Icon = intentIcon(intent.id)
            const isActive = intent.id === highlightIntentId

            if (intent.id === 'INTENT_FOOD') {
              const listId = 'tourist-rail-order-food-types'
              return (
                <div
                  key={intent.id}
                  className={`overflow-hidden rounded-xl border transition ${
                    isActive
                      ? 'border-[#ff7a1a] bg-[#fff8f2] text-[#9b5a2c]'
                      : 'border-transparent bg-[#f8f5f0] text-[#1f1f1f] hover:border-[#e7dfd5]'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isActive && foodTypesOpen}
                    aria-controls={listId}
                    onClick={() => {
                      if (!isActive) {
                        onSelectIntent(intent.id)
                        setFoodTypesOpen(true)
                      } else {
                        setFoodTypesOpen((o) => !o)
                      }
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff7a1a]/30"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? 'bg-[#ff7a1a] text-white' : 'bg-[#f0e8de] text-[#9b5a2c]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate leading-tight">{intent.label}</span>
                      <span className="text-[10px] font-normal leading-tight text-[#5b5b5b]">
                        {intent.count} partner{intent.count === 1 ? '' : 's'}
                        {isActive && foodMenuCategory !== 'ALL' ? (
                          <span className="text-[#9b5a2c]"> · {foodTypeLabel(foodMenuCategory)}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 text-[#9b5a2c] ring-1 ring-[#e7dfd5]/80">
                      {isActive && foodTypesOpen ? (
                        <FiChevronUp className="h-4 w-4" aria-hidden />
                      ) : (
                        <FiChevronDown className="h-4 w-4" aria-hidden />
                      )}
                    </span>
                  </button>
                  {isActive && foodTypesOpen ? (
                    <div className="border-t border-[#ffd4bc]/50 bg-[#fffdfb] px-1.5 pb-2 pt-1">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#a79a8b]">
                        Food type
                      </p>
                      <ul
                        id={listId}
                        role="listbox"
                        aria-label="Food type"
                        className="max-h-[min(50vh,12rem)] space-y-0.5 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                      >
                        <li>
                          <button
                            type="button"
                            role="option"
                            aria-selected={foodMenuCategory === 'ALL'}
                            onClick={() => {
                              onFoodMenuCategoryChange?.('ALL')
                              setFoodTypesOpen(false)
                            }}
                            className={`flex w-full rounded-lg px-2.5 py-2 text-left text-sm transition ${
                              foodMenuCategory === 'ALL'
                                ? 'bg-[#fff8f2] font-semibold text-[#9b5a2c] ring-1 ring-inset ring-[#ff7a1a]/35'
                                : 'text-[#1f1f1f] hover:bg-[#faf8f5]'
                            }`}
                          >
                            {foodMenuCategoriesLoading && !foodMenuCategories.length
                              ? 'All types (loading…)'
                              : 'All types'}
                          </button>
                        </li>
                        {foodMenuCategories.map((c) => (
                          <li key={c}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={foodMenuCategory === c}
                              onClick={() => {
                                onFoodMenuCategoryChange?.(c)
                                setFoodTypesOpen(false)
                              }}
                              className={`flex w-full rounded-lg px-2.5 py-2 text-left text-sm transition ${
                                foodMenuCategory === c
                                  ? 'bg-[#fff8f2] font-semibold text-[#9b5a2c] ring-1 ring-inset ring-[#ff7a1a]/35'
                                  : 'text-[#1f1f1f] hover:bg-[#faf8f5]'
                              }`}
                            >
                              {c}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )
            }

            return (
              <button
                key={intent.id}
                type="button"
                onClick={() => onSelectIntent(intent.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? 'border-[#ff7a1a] bg-[#fff8f2] text-[#9b5a2c]'
                    : 'border-transparent bg-[#f8f5f0] text-[#1f1f1f] hover:border-[#e7dfd5]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? 'bg-[#ff7a1a] text-white' : 'bg-[#f0e8de] text-[#9b5a2c]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-tight">{intent.label}</span>
                  <span className="text-[10px] font-normal leading-tight text-[#5b5b5b]">
                    {intent.count} partner{intent.count === 1 ? '' : 's'}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-[#ece3d9] p-4">
        {showPartnerTypeChips ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Partner type</p>
            <div className="mt-2 max-h-[min(40vh,16rem)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-0.5">
              <TouristCategoryChipsSection
                chips={filterChips}
                activeId={categoryFilter}
                onSelect={onSelectChip}
                layout="stacked"
              />
            </div>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-[#5b5b5b]">
            <span className="font-medium text-[#1f1f1f]">Goal filter on.</span> Tap &quot;All partners&quot; above to
            show every partner type again.
          </p>
        )}
      </div>

      <div className="border-t border-[#ece3d9] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Your activity</p>
        <Link
          to={touristOrdersHref}
          className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#ffd4bc] bg-[#fffaf5] px-2.5 py-2.5 text-sm font-semibold text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff7a1a] text-white">
            <FiShoppingBag className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block">Orders</span>
            <span className="text-[11px] font-normal text-[#5b5b5b]">Food &amp; bookings</span>
          </span>
        </Link>
      </div>
    </div>
  )
}

export default TouristExploreRightRailSection
