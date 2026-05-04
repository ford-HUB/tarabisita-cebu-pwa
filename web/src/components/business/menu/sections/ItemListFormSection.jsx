import { useRef, useState } from 'react'
import { FiImage, FiTrash2, FiX } from 'react-icons/fi'
import SaveMenuCategoryPresetModal from '../modals/SaveMenuCategoryPresetModal'

const ItemListFormSection = ({
  form,
  isImageLoading,
  isSavingMenuItem,
  setField,
  handleImageSelection,
  handleRemoveImage,
  handleAddMenuItem,
  menuCategoryPresets = [],
  pickMenuCategoryPreset,
  handleCategoryFieldKeyDown,
  isSaveMenuCategoryPresetOpen,
  pendingMenuCategoryPreset,
  confirmSaveMenuCategoryPreset,
  dismissSaveMenuCategoryPreset,
  deleteMenuCategoryPreset
}) => {
  const [isCategoryPresetPickerOpen, setIsCategoryPresetPickerOpen] = useState(false)
  const categoryBlurTimeout = useRef(null)

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

  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-[#fffcf8] p-5">
      <div className="rounded-xl border border-[#ecdccd] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Menu Name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Ex: Crispy Pork Sisig"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Flavor Profile *</span>
            <input
              type="text"
              value={form.flavor}
              onChange={(event) => setField('flavor', event.target.value)}
              placeholder="Savory, smoky, slightly spicy"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Price (PHP) *</span>
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
                placeholder="Main Course, Dessert, Drinks"
                className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
                autoComplete="off"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Preparation Time</span>
            <input
              type="text"
              value={form.preparationTime}
              onChange={(event) => setField('preparationTime', event.target.value)}
              placeholder="15 - 20 mins"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Serving Size</span>
            <input
              type="text"
              value={form.servingSize}
              onChange={(event) => setField('servingSize', event.target.value)}
              placeholder="Good for 2 persons"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Spice Level</span>
            <select
              value={form.spiceLevel}
              onChange={(event) => setField('spiceLevel', event.target.value)}
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            >
              <option value="No Spice">No Spice</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Spicy">Spicy</option>
              <option value="Extra Spicy">Extra Spicy</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[#5f5f5f]">Allergens</span>
            <input
              type="text"
              value={form.allergens}
              onChange={(event) => setField('allergens', event.target.value)}
              placeholder="Peanuts, seafood, dairy"
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-[#5f5f5f]">Description *</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Describe ingredients, taste, and why customers should try this."
              className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#5f5f5f]">Menu Photos * (minimum 2, up to 6)</p>
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
              Upload multiple dish images so customers can see different angles and servings.
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
            Available for order
          </label>
          <button
            type="button"
            onClick={handleAddMenuItem}
            disabled={isSavingMenuItem}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ee6d0f]"
          >
            {isSavingMenuItem ? 'Saving...' : 'Save Menu Item'}
          </button>
        </div>
      </div>

      <SaveMenuCategoryPresetModal
        isOpen={isSaveMenuCategoryPresetOpen}
        categoryLabel={pendingMenuCategoryPreset}
        onClose={dismissSaveMenuCategoryPreset}
        onConfirm={confirmSaveMenuCategoryPreset}
      />
    </section>
  )
}

export default ItemListFormSection
