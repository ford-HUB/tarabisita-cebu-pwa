import { useRef, useState } from 'react'
import { FiImage, FiTrash2, FiX } from 'react-icons/fi'
import SaveMenuCategoryPresetModal from '../modals/SaveMenuCategoryPresetModal'

const ItemListFormSection = ({
  form,
  categoryLabel = 'Business',
  isAccommodationBusiness = false,
  isImageLoading,
  isSavingMenuItem,
  setField,
  handleImageSelection,
  handleRemoveImage,
  handleAddMenuItem,
  menuCategoryPresets = [],
  menuFlavorPresets = [],
  pickMenuCategoryPreset,
  pickMenuFlavorPreset,
  handleCategoryFieldKeyDown,
  handleFlavorFieldKeyDown,
  isSaveMenuCategoryPresetOpen,
  pendingMenuCategoryPreset,
  confirmSaveMenuCategoryPreset,
  dismissSaveMenuCategoryPreset,
  deleteMenuCategoryPreset,
  isSaveMenuFlavorPresetOpen,
  pendingMenuFlavorPreset,
  confirmSaveMenuFlavorPreset,
  dismissSaveMenuFlavorPreset,
  deleteMenuFlavorPreset
}) => {
  const [isCategoryPresetPickerOpen, setIsCategoryPresetPickerOpen] = useState(false)
  const [isFlavorPresetPickerOpen, setIsFlavorPresetPickerOpen] = useState(false)
  const [addOnNameInput, setAddOnNameInput] = useState('')
  const [addOnPriceInput, setAddOnPriceInput] = useState('')
  const categoryBlurTimeout = useRef(null)
  const flavorBlurTimeout = useRef(null)

  const clearCategoryBlurTimeout = () => {
    if (categoryBlurTimeout.current) {
      window.clearTimeout(categoryBlurTimeout.current)
      categoryBlurTimeout.current = null
    }
  }

  const openCategoryPresetPicker = () => {
    clearCategoryBlurTimeout()
    setIsCategoryPresetPickerOpen(true)
  }

  const scheduleCloseCategoryPresetPicker = () => {
    clearCategoryBlurTimeout()
    categoryBlurTimeout.current = window.setTimeout(() => {
      setIsCategoryPresetPickerOpen(false)
      categoryBlurTimeout.current = null
    }, 150)
  }

  const handlePickPreset = (label) => {
    pickMenuCategoryPreset(label)
    setIsCategoryPresetPickerOpen(false)
  }

  const clearFlavorBlurTimeout = () => {
    if (flavorBlurTimeout.current) {
      window.clearTimeout(flavorBlurTimeout.current)
      flavorBlurTimeout.current = null
    }
  }

  const openFlavorPresetPicker = () => {
    clearFlavorBlurTimeout()
    setIsFlavorPresetPickerOpen(true)
  }

  const scheduleCloseFlavorPresetPicker = () => {
    clearFlavorBlurTimeout()
    flavorBlurTimeout.current = window.setTimeout(() => {
      setIsFlavorPresetPickerOpen(false)
      flavorBlurTimeout.current = null
    }, 150)
  }

  const handlePickFlavorPreset = (label) => {
    pickMenuFlavorPreset(label)
    setIsFlavorPresetPickerOpen(false)
  }

  const nameLabel = isAccommodationBusiness ? 'Listing Title *' : 'Menu Name *'
  const namePlaceholder = isAccommodationBusiness ? 'Ex: Deluxe Ocean View Room' : 'Ex: Crispy Pork Sisig'
  const flavorLabel = isAccommodationBusiness ? 'Accommodation Type *' : 'Flavor Profile *'
  const flavorPlaceholder = isAccommodationBusiness
    ? 'Room, Cottage, Villa, Cabin'
    : 'Savory, smoky, slightly spicy'
  const priceLabel = isAccommodationBusiness ? 'Rate (PHP) *' : 'Price (PHP) *'
  const categoryPlaceholder = isAccommodationBusiness
    ? 'Room Type, Package, Activity'
    : 'Main Course, Dessert, Drinks'
  const prepTimeLabel = isAccommodationBusiness ? 'Availability Schedule' : 'Preparation Time'
  const prepTimePlaceholder = isAccommodationBusiness ? 'Daily, Weekends only, 8:00 AM - 6:00 PM' : '15 - 20 mins'
  const servingSizeLabel = isAccommodationBusiness ? 'Accommodation Capacity' : 'Serving Size'
  const servingSizePlaceholder = isAccommodationBusiness ? 'Good for 2 guests' : 'Good for 2 persons'
  const spiceLabel = isAccommodationBusiness ? 'Accommodation Level' : 'Spice Level'
  const allergensLabel = isAccommodationBusiness ? 'Amenities' : 'Allergens'
  const allergensPlaceholder = isAccommodationBusiness ? 'WiFi, Aircon, Breakfast, Pool access' : 'Peanuts, seafood, dairy'
  const descriptionPlaceholder = isAccommodationBusiness
    ? 'Describe the room/accommodation details, inclusions, and resort highlights.'
    : 'Describe ingredients, taste, and why customers should try this.'
  const photosLabel = isAccommodationBusiness
    ? `${categoryLabel} Photos * (minimum 2, up to 6)`
    : 'Menu Photos * (minimum 2, up to 6)'
  const emptyPhotoHelp = isAccommodationBusiness
    ? 'Upload multiple photos to show room views, amenities, and resort surroundings.'
    : 'Upload multiple dish images so customers can see different angles and servings.'
  const availabilityToggleLabel = isAccommodationBusiness ? 'Available for booking' : 'Available for order'
  const saveButtonLabel = isAccommodationBusiness ? 'Save Listing' : 'Save Menu Item'
  const addOnRows = Array.isArray(form.addOns) ? form.addOns : []

  const handleAddOn = () => {
    const name = addOnNameInput.trim()
    const price = Number(addOnPriceInput)
    if (!name || !Number.isFinite(price) || price < 0) return
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setField('addOns', [...addOnRows, { id, name, price: Math.round(price * 100) / 100 }])
    setAddOnNameInput('')
    setAddOnPriceInput('')
  }

  const handleRemoveAddOn = (addOnId) => {
    setField(
      'addOns',
      addOnRows.filter((row) => String(row?.id) !== String(addOnId))
    )
  }

  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-[#fffcf8] p-5">
      <div className="rounded-xl border border-[#ecdccd] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{nameLabel}</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder={namePlaceholder}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{flavorLabel}</span>
            <div className="relative">
              {menuFlavorPresets.length > 0 && isFlavorPresetPickerOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-lg border border-[#e4dbd0] bg-white py-1 shadow-md"
                  role="listbox"
                  aria-label="Saved accommodation types"
                >
                  {menuFlavorPresets.map((preset) => (
                    <div
                      key={`flavor-${preset}`}
                      role="option"
                      className="flex items-stretch border-b border-[#f3ebe3] last:border-b-0"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 px-3 py-2 text-left text-sm text-[#3f3a35] transition hover:bg-[#fff5ec]"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handlePickFlavorPreset(preset)
                        }}
                      >
                        {preset}
                      </button>
                      <button
                        type="button"
                        className="shrink-0 px-2.5 text-[#a8988a] transition hover:bg-[#fff0e8] hover:text-[#c45c3c]"
                        aria-label={`Remove saved type ${preset}`}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          deleteMenuFlavorPreset(preset)
                        }}
                      >
                        <FiTrash2 size={15} aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={form.flavor}
                onChange={(event) => setField('flavor', event.target.value)}
                onKeyDown={handleFlavorFieldKeyDown}
                onFocus={openFlavorPresetPicker}
                onBlur={scheduleCloseFlavorPresetPicker}
                placeholder={flavorPlaceholder}
                className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
                autoComplete="off"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{priceLabel}</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) => setField('price', event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Category</span>
            <div className="relative">
              {menuCategoryPresets.length > 0 && isCategoryPresetPickerOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-lg border border-[#e4dbd0] bg-white py-1 shadow-md"
                  role="listbox"
                  aria-label="Saved categories"
                >
                  {menuCategoryPresets.map((preset) => (
                    <div
                      key={preset}
                      role="option"
                      className="flex items-stretch border-b border-[#f3ebe3] last:border-b-0"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 px-3 py-2 text-left text-sm text-[#3f3a35] transition hover:bg-[#fff5ec]"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handlePickPreset(preset)
                        }}
                      >
                        {preset}
                      </button>
                      <button
                        type="button"
                        className="shrink-0 px-2.5 text-[#a8988a] transition hover:bg-[#fff0e8] hover:text-[#c45c3c]"
                        aria-label={`Remove saved category ${preset}`}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          deleteMenuCategoryPreset(preset)
                        }}
                      >
                        <FiTrash2 size={15} aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={form.category}
                onChange={(event) => setField('category', event.target.value)}
                onKeyDown={handleCategoryFieldKeyDown}
                onFocus={openCategoryPresetPicker}
                onBlur={scheduleCloseCategoryPresetPicker}
                placeholder={categoryPlaceholder}
                className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
                autoComplete="off"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{prepTimeLabel}</span>
            <input
              type="text"
              value={form.preparationTime}
              onChange={(event) => setField('preparationTime', event.target.value)}
              placeholder={prepTimePlaceholder}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{servingSizeLabel}</span>
            <input
              type="text"
              value={form.servingSize}
              onChange={(event) => setField('servingSize', event.target.value)}
              placeholder={servingSizePlaceholder}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{spiceLabel}</span>
            <select
              value={form.spiceLevel}
              onChange={(event) => setField('spiceLevel', event.target.value)}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            >
              {isAccommodationBusiness ? (
                <>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </>
              ) : (
                <>
                  <option value="No Spice">No Spice</option>
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Spicy">Spicy</option>
                  <option value="Extra Spicy">Extra Spicy</option>
                </>
              )}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">{allergensLabel}</span>
            <input
              type="text"
              value={form.allergens}
              onChange={(event) => setField('allergens', event.target.value)}
              placeholder={allergensPlaceholder}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-[#5f5f5f]">Description *</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder={descriptionPlaceholder}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>
          {isAccommodationBusiness ? (
            <div className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Booking Add-ons (optional)</span>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_10rem_auto]">
                <input
                  type="text"
                  value={addOnNameInput}
                  onChange={(event) => setAddOnNameInput(event.target.value)}
                  placeholder="Food package, Extra bed, Decorations"
                  className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addOnPriceInput}
                  onChange={(event) => setAddOnPriceInput(event.target.value)}
                  placeholder="Price"
                  className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
                />
                <button
                  type="button"
                  onClick={handleAddOn}
                  className="rounded-lg border border-[#e4dbd0] bg-white px-3 py-2 text-xs font-semibold text-[#7d5b3b] transition hover:bg-[#fff6ee]"
                >
                  Add
                </button>
              </div>
              {addOnRows.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {addOnRows.map((row) => (
                    <div key={String(row.id)} className="flex items-center justify-between rounded-lg border border-[#eadfce] bg-[#fffaf4] px-3 py-2">
                      <p className="text-xs text-[#3f3a35]">
                        <span className="font-medium">{row.name}</span>{' '}
                        <span className="text-[#9b5a2c]">(+₱{Number(row.price || 0).toLocaleString('en-PH')})</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddOn(row.id)}
                        className="rounded-full p-1 text-[#a06f52] transition hover:bg-[#fff0e8] hover:text-[#c45c3c]"
                        aria-label={`Remove add-on ${row.name}`}
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8a7f74]">No add-ons yet. Add options and prices tourists can select while booking.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#5f5f5f]">{photosLabel}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e4dbd0] bg-[#fffaf4] px-3 py-1.5 text-xs font-medium text-[#7d5b3b] transition hover:bg-[#fdf0e2]">
              <FiImage size={14} />
              {isImageLoading ? 'Uploading...' : 'Add Photos'}
              <input type="file" multiple accept="image/*" onChange={handleImageSelection} className="hidden" />
            </label>
          </div>

          {form.images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {form.images.map((image, index) => (
                <div key={`menu-preview-${index}`} className="relative overflow-hidden rounded-lg border border-[#ecdfd1]">
                  <img src={image} alt={`Menu preview ${index + 1}`} className="h-36 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-[#7d3e2c] shadow-sm transition hover:bg-white"
                    aria-label="Remove image"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#ecdccd] bg-[#fffaf4] p-4 text-xs text-[#8a7f74]">
              {emptyPhotoHelp}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#4f4f4f]">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => setField('isAvailable', event.target.checked)}
              className="h-4 w-4 rounded border-[#d7cbbc]"
            />
            {availabilityToggleLabel}
          </label>
          <button
            type="button"
            onClick={handleAddMenuItem}
            disabled={isSavingMenuItem}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ee6d0f]"
          >
            {isSavingMenuItem ? 'Saving...' : saveButtonLabel}
          </button>
        </div>
      </div>

      <SaveMenuCategoryPresetModal
        isOpen={isSaveMenuCategoryPresetOpen}
        categoryLabel={pendingMenuCategoryPreset}
        onClose={dismissSaveMenuCategoryPreset}
        onConfirm={confirmSaveMenuCategoryPreset}
      />
      <SaveMenuCategoryPresetModal
        isOpen={isSaveMenuFlavorPresetOpen}
        categoryLabel={pendingMenuFlavorPreset}
        title={isAccommodationBusiness ? 'Save accommodation type' : 'Save flavor profile'}
        maxLabel={isAccommodationBusiness ? 'accommodation types' : 'flavor profiles'}
        onClose={dismissSaveMenuFlavorPreset}
        onConfirm={confirmSaveMenuFlavorPreset}
      />
    </section>
  )
}

export default ItemListFormSection
