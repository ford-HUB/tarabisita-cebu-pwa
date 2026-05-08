import { useMemo, useState } from 'react'
import { FiBox, FiEdit2, FiGrid, FiList, FiMoreVertical, FiSearch, FiTrash2 } from 'react-icons/fi'
import EditItemModal from '../modals/EditItemModal'
import DeletedItemsModal from '../modals/DeletedItemsModal'

const ACTION_MENU_WIDTH = 176
const ACTION_MENU_HEIGHT = 124
const ACTION_MENU_GAP = 8
const VIEWPORT_PADDING = 8

const stockStatusLabelMap = {
  OUT_OF_STOCK: 'Unavailable'
}

const formatPrice = (price) =>
  Number(price).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  })

const ItemListSection = ({
  menuItems,
  isLoadingMenuItems,
  addLabel,
  isAccommodationBusiness = false,
  activeDeleteId,
  activeStockId,
  handleDeleteMenuItem,
  handleStockStatusChange,
  categoryLabel,
  deletedMenuItems,
  isDeletedModalOpen,
  setIsDeletedModalOpen,
  activeRestoreId,
  handleRestoreMenuItem,
  activeEditId,
  isEditModalOpen,
  selectedEditItem,
  openEditModal,
  closeEditModal,
  handleEditMenuItem
}) => {
  const itemTerm = categoryLabel === 'Restaurant' ? 'menu' : isAccommodationBusiness ? 'listing' : 'product'
  const titleLabel = categoryLabel === 'Restaurant'
    ? 'Published Menus'
    : isAccommodationBusiness
      ? 'Published Listings'
      : 'Published Products'
  const availableStatusLabel = isAccommodationBusiness ? 'Available to Book' : 'Available to Order'
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('CARD')
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenu, setOpenActionMenu] = useState(null)

  const categoryOptions = useMemo(() => {
    const categories = new Set()
    menuItems.forEach((item) => {
      if (item?.category?.trim()) categories.add(item.category.trim())
    })
    return Array.from(categories).sort((a, b) => a.localeCompare(b))
  }, [menuItems])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return menuItems.filter((item) => {
      const currentStock = item.stockStatus || (item.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
      const matchesSearch =
        !query ||
        [item.name, item.description, item.flavor, item.category]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query))
      const matchesStock = stockFilter === 'ALL' || currentStock === stockFilter
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
      return matchesSearch && matchesStock && matchesCategory
    })
  }, [menuItems, searchQuery, stockFilter, categoryFilter])

  const toggleActionMenu = (itemId, triggerElement) => {
    if (!triggerElement) return
    const rect = triggerElement.getBoundingClientRect()

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Prefer showing after (right side of) the 3-dot trigger.
    let left = rect.right + ACTION_MENU_GAP
    if (left + ACTION_MENU_WIDTH > viewportWidth - VIEWPORT_PADDING) {
      left = rect.left - ACTION_MENU_WIDTH - ACTION_MENU_GAP
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING
    }

    // Vertically center to the trigger for a "next to icon" feel.
    let top = rect.top + rect.height / 2 - ACTION_MENU_HEIGHT / 2
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING
    }
    if (top + ACTION_MENU_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - ACTION_MENU_HEIGHT - VIEWPORT_PADDING
    }

    setOpenActionMenu((previous) =>
      previous?.id === itemId
        ? null
        : {
            id: itemId,
            top,
            left
          }
    )
  }

  const closeActionMenu = () => {
    setOpenActionMenu(null)
  }

  const pageSize = viewMode === 'CARD' ? 6 : 8
  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = filteredItems.slice(startIndex, endIndex)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[#2f2f2f]">{titleLabel}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-[#6f665d]">{filteredItems.length} item(s)</p>
          <label className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-xs text-[#7d5b3b]">
            {viewMode === 'CARD' ? <FiGrid size={13} /> : <FiList size={13} />}
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="CARD">Card View</option>
              <option value="ROW">Row View</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="relative md:col-span-1">
          <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9a8b7c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${itemTerm} name, details, category`}
            className="w-full rounded-xl border border-[#eadfce] bg-white py-2 pr-3 pl-9 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
          />
        </label>
        <select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
          className="rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
        >
          <option value="ALL">All Availability</option>
          <option value="AVAILABLE_TO_ORDER">
            {isAccommodationBusiness ? 'Available to Book' : 'Available to Order'}
          </option>
          <option value="OUT_OF_STOCK">Unavailable</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3f3f3f] outline-none transition focus:border-[#ff7a1a]"
        >
          <option value="ALL">All Categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {isLoadingMenuItems ? (
        <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
          {isAccommodationBusiness ? 'Loading listings...' : 'Loading menu items...'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e8ddd0] bg-[#fffaf5] p-8 text-center text-sm text-[#8f8377]">
          No matching {itemTerm} found. Click <span className="font-medium text-[#7d5b3b]">{addLabel}</span> to start listing.
        </div>
      ) : viewMode === 'ROW' ? (
        <div className="space-y-2">
          {paginatedItems.map((item) => {
            const currentStock = item.stockStatus || (item.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
            return (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ecdfd1] bg-white px-3 py-3"
              >
                <div className="flex min-w-[220px] flex-1 items-center gap-3">
                  <img src={item.images?.[0]} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div>
                  <p className="text-sm font-semibold text-[#2f2f2f]">{item.name}</p>
                    <p className="text-xs text-[#8a7f74]">{item.category || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#7d5b3b]">{formatPrice(item.price)}</div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    currentStock === 'OUT_OF_STOCK' ? 'bg-[#fbecec] text-[#9c4040]' : 'bg-[#e8f8ec] text-[#2a7b45]'
                  }`}
                >
                  {stockStatusLabelMap[currentStock] || availableStatusLabel}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => toggleActionMenu(item.id, event.currentTarget)}
                    className="inline-flex items-center justify-center rounded-full border border-[#eadfce] p-1.5 text-[#7d5b3b] transition hover:bg-[#fff4e8]"
                  >
                    <FiMoreVertical size={14} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.map((item) => {
            const currentStock = item.stockStatus || (item.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-[#ecdfd1] bg-white shadow-sm">
                <img src={item.images?.[0]} alt={item.name} className="h-40 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-semibold text-[#2f2f2f]">{item.name}</h4>
                    <span className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-xs font-semibold text-[#9b5a2c]">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <p className="text-sm text-[#6f665d]">{item.description}</p>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {item.category ? (
                      <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">{item.category}</span>
                    ) : null}
                    <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">
                      {isAccommodationBusiness ? 'Accommodation' : 'Flavor'}: {item.flavor}
                    </span>
                    {item.preparationTime ? (
                      <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">
                        {isAccommodationBusiness ? 'Availability' : 'Prep'}: {item.preparationTime}
                      </span>
                    ) : null}
                    {item.servingSize ? (
                      <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">
                        {isAccommodationBusiness ? `Capacity: ${item.servingSize}` : item.servingSize}
                      </span>
                    ) : null}
                    {item.spiceLevel ? (
                      <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">
                        {isAccommodationBusiness ? 'Level' : 'Spice'}: {item.spiceLevel}
                      </span>
                    ) : null}
                    {isAccommodationBusiness && item.allergens ? (
                      <span className="rounded-full bg-[#f6efe7] px-2 py-1 text-[#6f665d]">
                        Amenities: {item.allergens}
                      </span>
                    ) : null}
                  </div>

                  {item.images?.length > 1 && (
                    <p className="text-xs text-[#8a7f74]">+{item.images.length - 1} more photo(s) uploaded</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        currentStock === 'OUT_OF_STOCK'
                          ? 'bg-[#fbecec] text-[#9c4040]'
                          : 'bg-[#e8f8ec] text-[#2a7b45]'
                      }`}
                    >
                      {stockStatusLabelMap[currentStock] || availableStatusLabel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => toggleActionMenu(item.id, event.currentTarget)}
                          className="inline-flex items-center justify-center rounded-full border border-[#eadfce] p-1.5 text-[#7d5b3b] transition hover:bg-[#fff4e8]"
                        >
                          <FiMoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#ecdfd1] bg-[#fffdfb] px-3 py-2">
          <p className="text-xs text-[#7f7266]">
            Showing <span className="font-medium">{startIndex + 1}</span>-
            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
            <span className="font-medium">{totalItems}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-md border border-[#e7dacd] px-2 py-1 text-xs text-[#6f665d] transition hover:bg-[#fff3e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={`page-${pageNumber}`}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-md border px-2 py-1 text-xs transition ${
                  safeCurrentPage === pageNumber
                    ? 'border-[#ff7a1a] bg-[#fff0e3] text-[#9b5a2c]'
                    : 'border-[#e7dacd] text-[#6f665d] hover:bg-[#fff3e8]'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-md border border-[#e7dacd] px-2 py-1 text-xs text-[#6f665d] transition hover:bg-[#fff3e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {openActionMenu && (
        <>
          <button type="button" aria-label="Close actions menu" onClick={closeActionMenu} className="fixed inset-0 z-40 cursor-default" />
          <div
            className="fixed z-50 w-44 overflow-hidden rounded-xl border border-[#eedfce] bg-white shadow-lg"
            style={{
              top: `${openActionMenu.top}px`,
              left: `${openActionMenu.left}px`
            }}
          >
            {(() => {
              const item = menuItems.find((entry) => entry.id === openActionMenu.id)
              if (!item) return null
              const currentStock = item.stockStatus || (item.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
              return (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openEditModal(item)
                      closeActionMenu()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#3b5f88] transition hover:bg-[#f4f8ff]"
                  >
                    <FiEdit2 size={12} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStockStatusChange(
                        item.id,
                        currentStock === 'OUT_OF_STOCK' ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK'
                      )
                      closeActionMenu()
                    }}
                    disabled={activeStockId === item.id}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#4c6645] transition hover:bg-[#f4fbf5]"
                  >
                    <FiBox size={12} />
                    {activeStockId === item.id
                      ? 'Updating...'
                      : currentStock === 'OUT_OF_STOCK'
                      ? isAccommodationBusiness
                        ? 'Available to Book'
                        : 'Available to Order'
                      : 'Unavailable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteMenuItem(item.id)
                      closeActionMenu()
                    }}
                    disabled={activeDeleteId === item.id}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#8f4c3a] transition hover:bg-[#fff4ee]"
                  >
                    <FiTrash2 size={12} />
                    {activeDeleteId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )
            })()}
          </div>
        </>
      )}

      <EditItemModal
        key={`${selectedEditItem?.id || 'edit-item-modal'}-${isEditModalOpen ? 'open' : 'closed'}`}
        isOpen={isEditModalOpen}
        item={selectedEditItem}
        isAccommodationBusiness={isAccommodationBusiness}
        isSaving={activeEditId === selectedEditItem?.id}
        onClose={closeEditModal}
        onSave={handleEditMenuItem}
      />

      <DeletedItemsModal
        isOpen={isDeletedModalOpen}
        deletedItems={deletedMenuItems}
        activeRestoreId={activeRestoreId}
        onClose={() => setIsDeletedModalOpen(false)}
        onRestore={handleRestoreMenuItem}
      />
    </section>
  )
}

export default ItemListSection
