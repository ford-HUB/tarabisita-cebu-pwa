import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import { editItemSchema } from '../../../../shared/validators/itemList.validator'

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl.startsWith('data:image/')) {
        reject(new Error('INVALID_IMAGE'))
        return
      }
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })

const mapItemToForm = (item, { isAccommodationBusiness = false } = {}) => ({
  name: item?.name || '',
  description: item?.description || '',
  flavor: item?.flavor || '',
  price: Number(item?.price || 0),
  category: item?.category || '',
  preparationTime: item?.preparationTime || '',
  servingSize: item?.servingSize || '',
  spiceLevel: item?.spiceLevel || (isAccommodationBusiness ? 'Standard' : 'No Spice'),
  allergens: item?.allergens || '',
  addOns: Array.isArray(item?.addOns) ? item.addOns : [],
  stockStatus: item?.stockStatus || (item?.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
})

const EditItemModal = ({ isOpen, item, isAccommodationBusiness = false, isSaving, onClose, onSave }) => {
  const [imageReplacements, setImageReplacements] = useState({})
  const [imageIndex, setImageIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [addOns, setAddOns] = useState(() => (Array.isArray(item?.addOns) ? item.addOns : []))
  const [addOnNameInput, setAddOnNameInput] = useState('')
  const [addOnPriceInput, setAddOnPriceInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(editItemSchema),
    defaultValues: mapItemToForm(item, { isAccommodationBusiness })
  })

  const baseImages = Array.isArray(item?.images) ? item.images : []
  const images = baseImages.map((image, index) => imageReplacements[index] || image)

  const safeImageIndex = images.length ? Math.min(imageIndex, images.length - 1) : 0
  const activeImage = images[safeImageIndex] || ''

  const imageCounterLabel = images.length ? `${safeImageIndex + 1} / ${images.length}` : '0 / 0'

  const showPreviousImage = () => {
    if (!images.length) return
    setImageIndex((current) => (current <= 0 ? images.length - 1 : current - 1))
  }

  const showNextImage = () => {
    if (!images.length) return
    setImageIndex((current) => (current >= images.length - 1 ? 0 : current + 1))
  }

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches?.[0]?.clientX || 0)
  }

  const handleTouchEnd = (event) => {
    const endX = event.changedTouches?.[0]?.clientX || 0
    const delta = endX - touchStartX
    if (Math.abs(delta) < 30) return
    if (delta > 0) {
      showPreviousImage()
      return
    }
    showNextImage()
  }

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await toDataUrl(file)
      setImageReplacements((current) => ({ ...current, [safeImageIndex]: dataUrl }))
      toast.success('Image updated. Save changes to apply.')
    } catch {
      toast.error('Please select a valid image file.')
    }
  }

  const onSubmit = async (values) => {
    const success = await onSave({
      ...values,
      addOns,
      imageReplacements: Object.entries(imageReplacements).map(([index, image]) => ({
        index: Number(index),
        image
      }))
    })
    if (success) onClose()
  }

  if (!isOpen) return null

  const handleAddOn = () => {
    const name = addOnNameInput.trim()
    const price = Number(addOnPriceInput)
    if (!name || !Number.isFinite(price) || price < 0) return
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setAddOns((prev) => [...prev, { id, name, price: Math.round(price * 100) / 100 }])
    setAddOnNameInput('')
    setAddOnPriceInput('')
  }

  const handleRemoveAddOn = (addOnId) => {
    setAddOns((prev) => prev.filter((row) => String(row?.id) !== String(addOnId)))
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-3 py-6">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f1e8de] px-5 py-4">
          <h4 className="text-base font-semibold text-[#2f2f2f]">
            {isAccommodationBusiness ? 'Edit Listing' : 'Edit Menu Item'}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e7dacd] px-3 py-1.5 text-xs font-medium text-[#7d5b3b] transition hover:bg-[#fff7ef]"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          <div className="space-y-2 rounded-xl border border-[#ecdfd1] bg-[#fffaf5] p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#6f665d]">
                {isAccommodationBusiness ? 'Listing Photos' : 'Menu Photos'} ({images.length})
              </p>
              <p className="text-xs text-[#8a7f74]">{imageCounterLabel}</p>
            </div>

            {activeImage ? (
              <div
                className="relative overflow-hidden rounded-lg border border-[#e8ddd0] bg-white"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={activeImage}
                  alt={`${isAccommodationBusiness ? 'Listing' : 'Menu item'} ${safeImageIndex + 1}`}
                  className="h-48 w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={showPreviousImage} className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white">
                      <FiChevronLeft size={14} />
                    </button>
                    <button type="button" onClick={showNextImage} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white">
                      <FiChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#e8ddd0] bg-white p-6 text-center text-xs text-[#8a7f74]">
                No photos available for this item.
              </div>
            )}

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`edit-thumb-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={`shrink-0 overflow-hidden rounded-md border ${safeImageIndex === index ? 'border-[#ff7a1a]' : 'border-[#eadfce]'}`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="h-12 w-12 object-cover" />
                  </button>
                ))}
              </div>
            )}

            {activeImage && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-xs font-medium text-[#7d5b3b] transition hover:bg-[#fff2e6]">
                Replace this image
                <input type="file" accept="image/*" onChange={handleImageSelection} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Listing Title *' : 'Menu Name *'}
              </span>
              <input type="text" {...register('name')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.name && <p className="text-xs text-[#b42318]">{errors.name.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Accommodation Type *' : 'Flavor Profile *'}
              </span>
              <input type="text" {...register('flavor')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.flavor && <p className="text-xs text-[#b42318]">{errors.flavor.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Rate (PHP) *' : 'Price (PHP) *'}
              </span>
              <input type="number" min="1" step="0.01" {...register('price')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.price && <p className="text-xs text-[#b42318]">{errors.price.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Category</span>
              <input type="text" {...register('category')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Availability Schedule' : 'Preparation Time'}
              </span>
              <input type="text" {...register('preparationTime')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Accommodation Capacity' : 'Serving Size'}
              </span>
              <input type="text" {...register('servingSize')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Accommodation Level' : 'Spice Level'}
              </span>
              <select
                {...register('spiceLevel')}
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
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">
                {isAccommodationBusiness ? 'Amenities' : 'Allergens'}
              </span>
              <input type="text" {...register('allergens')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Description *</span>
              <textarea rows={3} {...register('description')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.description && <p className="text-xs text-[#b42318]">{errors.description.message}</p>}
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
                {addOns.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {addOns.map((row) => (
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
                  <p className="text-xs text-[#8a7f74]">No add-ons configured for this listing.</p>
                )}
              </div>
            ) : null}
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Availability</span>
              <select {...register('stockStatus')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]">
                <option value="AVAILABLE_TO_ORDER">
                  {isAccommodationBusiness ? 'Available to Book' : 'Available to Order'}
                </option>
                <option value="OUT_OF_STOCK">Unavailable</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-[#ff7a1a] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#ee6d0f]"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditItemModal
