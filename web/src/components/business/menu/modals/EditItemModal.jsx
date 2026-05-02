import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
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

const mapItemToForm = (item) => ({
  name: item?.name || '',
  description: item?.description || '',
  flavor: item?.flavor || '',
  price: Number(item?.price || 0),
  category: item?.category || '',
  preparationTime: item?.preparationTime || '',
  servingSize: item?.servingSize || '',
  spiceLevel: item?.spiceLevel || 'No Spice',
  allergens: item?.allergens || '',
  stockStatus: item?.stockStatus || (item?.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK')
})

const EditItemModal = ({ isOpen, item, isSaving, onClose, onSave }) => {
  const [imageReplacements, setImageReplacements] = useState({})
  const [imageIndex, setImageIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(editItemSchema),
    defaultValues: mapItemToForm(item)
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
      imageReplacements: Object.entries(imageReplacements).map(([index, image]) => ({
        index: Number(index),
        image
      }))
    })
    if (success) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-3 py-6">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f1e8de] px-5 py-4">
          <h4 className="text-base font-semibold text-[#2f2f2f]">Edit Menu Item</h4>
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
              <p className="text-xs font-medium text-[#6f665d]">Menu Photos ({images.length})</p>
              <p className="text-xs text-[#8a7f74]">{imageCounterLabel}</p>
            </div>

            {activeImage ? (
              <div
                className="relative overflow-hidden rounded-lg border border-[#e8ddd0] bg-white"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img src={activeImage} alt={`Menu item ${safeImageIndex + 1}`} className="h-48 w-full object-cover" />
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
              <span className="text-xs font-medium text-[#5f5f5f]">Menu Name *</span>
              <input type="text" {...register('name')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.name && <p className="text-xs text-[#b42318]">{errors.name.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Flavor Profile *</span>
              <input type="text" {...register('flavor')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.flavor && <p className="text-xs text-[#b42318]">{errors.flavor.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Price (PHP) *</span>
              <input type="number" min="1" step="0.01" {...register('price')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.price && <p className="text-xs text-[#b42318]">{errors.price.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Category</span>
              <input type="text" {...register('category')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Preparation Time</span>
              <input type="text" {...register('preparationTime')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Serving Size</span>
              <input type="text" {...register('servingSize')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-[#5f5f5f]">Spice Level</span>
              <select {...register('spiceLevel')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]">
                <option value="No Spice">No Spice</option>
                <option value="Mild">Mild</option>
                <option value="Medium">Medium</option>
                <option value="Spicy">Spicy</option>
                <option value="Extra Spicy">Extra Spicy</option>
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Allergens</span>
              <input type="text" {...register('allergens')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Description *</span>
              <textarea rows={3} {...register('description')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]" />
              {errors.description && <p className="text-xs text-[#b42318]">{errors.description.message}</p>}
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-[#5f5f5f]">Availability</span>
              <select {...register('stockStatus')} className="w-full rounded-lg border border-[#e4dbd0] px-3 py-2 text-sm outline-none transition focus:border-[#ff7a1a]">
                <option value="AVAILABLE_TO_ORDER">Available to Order</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
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
