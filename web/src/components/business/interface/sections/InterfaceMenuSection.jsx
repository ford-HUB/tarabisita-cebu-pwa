import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'

const formatPrice = (value) =>
  Number(value || 0).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

const InterfaceMenuSection = ({
  categoryLabel,
  showCardDetails,
  setShowCardDetails,
  cardListClassName,
  emptyCards,
  getCardClassName,
  menuItems,
  isLoadingMenuItems,
  menuCategories
}) => {
  const [menuSearch, setMenuSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const isRestaurant = categoryLabel === 'Restaurant'

  const filteredItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase()
    return menuItems.filter((item) => {
      const categoryText = String(item?.category || 'All').trim() || 'All'
      const matchesCategory =
        activeCategory === 'ALL' || categoryText.toLowerCase() === activeCategory.toLowerCase()
      const matchesSearch =
        !query ||
        [item?.name, item?.description, item?.flavor, item?.category]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query))
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, menuItems, menuSearch])

  const groupedItems = useMemo(() => {
    const buckets = new Map()
    filteredItems.forEach((item) => {
      const groupName = String(item?.category || 'All').trim() || 'All'
      if (!buckets.has(groupName)) buckets.set(groupName, [])
      buckets.get(groupName).push(item)
    })
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredItems])

  return (
    <section className="rounded-2xl border border-[#e7ddd2] bg-[#faf7f2] p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">
            {categoryLabel === 'Restaurant' ? 'Menu Listings' : 'Posted Products'}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#1f1f1f]">
            {categoryLabel === 'Restaurant' ? 'Your Menu Cards' : 'Your Product Cards'}
          </h3>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCardDetails((value) => !value)}
          className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
          style={{ borderColor: '#d8cdbf', backgroundColor: showCardDetails ? '#f0e7dd' : '#ffffff', color: '#2f2f2f' }}
        >
          {showCardDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {isRestaurant ? (
        <div className="rounded-2xl border border-[#ede5db] bg-white p-4 md:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <label className="relative w-full max-w-sm">
              <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9d9286]" size={14} />
              <input
                type="text"
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
                placeholder="Search in menu"
                className="h-10 w-full rounded-full border border-[#ece3d8] bg-[#fcfaf7] pr-3 pl-9 text-sm text-[#403a34] outline-none transition focus:border-[#d5c6b3]"
              />
            </label>
            <div className="inline-flex items-center gap-1 rounded-full border border-[#ece3d8] bg-[#fcfaf7] px-2 py-1 text-[#9d9286]">
              <FiChevronLeft size={14} />
              <FiChevronRight size={14} />
            </div>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === 'ALL'
                  ? 'border-[#2f2f2f] bg-white text-[#2f2f2f]'
                  : 'border-[#ece3d8] bg-[#fcfaf7] text-[#6f665d]'
              }`}
            >
              All ({menuItems.length})
            </button>
            {menuCategories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.label)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeCategory.toLowerCase() === category.label.toLowerCase()
                    ? 'border-[#2f2f2f] bg-white text-[#2f2f2f]'
                    : 'border-[#ece3d8] bg-[#fcfaf7] text-[#6f665d]'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {isLoadingMenuItems ? (
              <div className="rounded-xl border border-dashed border-[#e9dfd2] bg-[#fffaf4] p-8 text-center text-sm text-[#8b7f73]">
                Loading your menu...
              </div>
            ) : groupedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e9dfd2] bg-[#fffaf4] p-8 text-center text-sm text-[#8b7f73]">
                No menu items found for this filter.
              </div>
            ) : (
              groupedItems.map(([groupName, items]) => (
                <div key={groupName} className="space-y-3">
                  <h4 className="text-2xl font-semibold text-[#28221d]">{groupName}</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((item) => (
                      <article key={item.id} className="rounded-xl border border-[#efe5d9] bg-white p-3">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <h5 className="line-clamp-1 text-base font-semibold text-[#2f2f2f]">{item.name}</h5>
                            <p className="mt-0.5 text-sm text-[#5f5851]">{formatPrice(item.price)}</p>
                            {showCardDetails ? (
                              <p className="mt-2 line-clamp-2 text-sm text-[#7c736a]">{item.description || 'No description yet.'}</p>
                            ) : null}
                          </div>
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-[#f3ece3]">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9f9285]">No photo</div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={cardListClassName}>
          {emptyCards.map((_, index) => (
            <article key={`empty-card-${index}`} className={getCardClassName(index)}>
              <div className="flex h-28 items-center justify-center rounded-lg bg-[#f8f4ee] text-xs text-[#a29688]">
                No image yet
              </div>
              <p className="mt-3 text-sm font-medium text-[#2f2f2f]">
                Empty {categoryLabel === 'Restaurant' ? 'Menu' : 'Product'} Card
              </p>
              {showCardDetails && (
                <p className="mt-1 text-xs text-[#7a736b]">Add details, image, and price to publish this card.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default InterfaceMenuSection
