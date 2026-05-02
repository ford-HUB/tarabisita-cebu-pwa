import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createMyBusinessMenuItem,
  deleteMyBusinessMenuItem,
  getMyBusinessMenuItems,
  restoreMyBusinessMenuItem,
  updateMyBusinessMenuItem,
  updateMyBusinessMenuItemStock
} from '../services/business/business.service'

const MAX_IMAGE_COUNT = 6

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

const createBlankForm = () => ({
  name: '',
  description: '',
  flavor: '',
  price: '',
  category: '',
  preparationTime: '',
  servingSize: '',
  spiceLevel: 'No Spice',
  allergens: '',
  isAvailable: true,
  images: []
})

export const useBusinessItemList = (user) => {
  const [form, setForm] = useState(createBlankForm)
  const [isAddingMenu, setIsAddingMenu] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false)
  const [isSavingMenuItem, setIsSavingMenuItem] = useState(false)
  const [activeDeleteId, setActiveDeleteId] = useState('')
  const [activeStockId, setActiveStockId] = useState('')
  const [activeRestoreId, setActiveRestoreId] = useState('')
  const [activeEditId, setActiveEditId] = useState('')
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEditItem, setSelectedEditItem] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [deletedMenuItems, setDeletedMenuItems] = useState([])

  useEffect(() => {
    const loadMenuItems = async () => {
      if (!user?._id) {
        setMenuItems([])
        return
      }
      try {
        setIsLoadingMenuItems(true)
        const response = await getMyBusinessMenuItems({ includeDeleted: true })
        const allItems = Array.isArray(response?.data?.data) ? response.data.data : []
        setMenuItems(allItems.filter((item) => !item.isDeleted))
        setDeletedMenuItems(allItems.filter((item) => item.isDeleted))
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load menu items.')
      } finally {
        setIsLoadingMenuItems(false)
      }
    }

    loadMenuItems()
  }, [user?._id])

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return

    const remainingSlots = MAX_IMAGE_COUNT - form.images.length
    if (remainingSlots <= 0) {
      toast.error(`Maximum of ${MAX_IMAGE_COUNT} images only.`)
      return
    }

    const selectedFiles = files.slice(0, remainingSlots)

    try {
      setIsImageLoading(true)
      const dataUrls = await Promise.all(selectedFiles.map((file) => toDataUrl(file)))
      setForm((previous) => ({ ...previous, images: [...previous.images, ...dataUrls] }))

      if (files.length > selectedFiles.length) {
        toast.info(`Only ${MAX_IMAGE_COUNT} images are allowed per menu item.`)
      }
    } catch {
      toast.error('Please select valid image files.')
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleRemoveImage = (indexToRemove) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, index) => index !== indexToRemove)
    }))
  }

  const resetForm = () => {
    setForm(createBlankForm())
  }

  const validateForm = () => {
    if (form.name.trim().length < 2) return 'Menu name must be at least 2 characters.'
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters.'
    if (form.flavor.trim().length < 2) return 'Flavor profile is required.'
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return 'Price must be greater than zero.'
    if (form.images.length < 2) return 'Add at least 2 menu photos.'
    return ''
  }

  const handleAddMenuItem = async () => {
    const validationMessage = validateForm()
    if (validationMessage) {
      toast.error(validationMessage)
      return false
    }

    try {
      setIsSavingMenuItem(true)
      const response = await createMyBusinessMenuItem({
        name: form.name.trim(),
        description: form.description.trim(),
        flavor: form.flavor.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        preparationTime: form.preparationTime.trim(),
        servingSize: form.servingSize.trim(),
        spiceLevel: form.spiceLevel,
        allergens: form.allergens.trim(),
        isAvailable: Boolean(form.isAvailable),
        images: form.images
      })
      const createdItem = response?.data?.data
      if (createdItem) {
        setMenuItems((previous) => [createdItem, ...previous])
      }
      resetForm()
      setIsAddingMenu(false)
      toast.success('Menu item added successfully.')
      return true
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add menu item.')
      return false
    } finally {
      setIsSavingMenuItem(false)
    }
  }

  const handleDeleteMenuItem = async (id) => {
    try {
      setActiveDeleteId(id)
      const response = await deleteMyBusinessMenuItem(id)
      const deletedItem = menuItems.find((item) => item.id === id)
      setMenuItems((previous) => previous.filter((item) => item.id !== id))
      if (deletedItem) {
        setDeletedMenuItems((previous) => [
          { ...deletedItem, isDeleted: true, deletedAt: new Date().toISOString() },
          ...previous
        ])
      }
      toast.success(response?.data?.message || 'Menu item moved to deleted list.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete menu item.')
    } finally {
      setActiveDeleteId('')
    }
  }

  const handleStockStatusChange = async (id, stockStatus) => {
    try {
      setActiveStockId(id)
      const response = await updateMyBusinessMenuItemStock(id, stockStatus)
      const updatedItem = response?.data?.data
      if (updatedItem) {
        setMenuItems((previous) => previous.map((item) => (item.id === id ? updatedItem : item)))
      }
      toast.success(stockStatus === 'OUT_OF_STOCK' ? 'Marked as out of stock.' : 'Marked as available to order.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update menu status.')
    } finally {
      setActiveStockId('')
    }
  }

  const handleRestoreMenuItem = async (id) => {
    try {
      setActiveRestoreId(id)
      const response = await restoreMyBusinessMenuItem(id)
      const restoredItem = response?.data?.data
      setDeletedMenuItems((previous) => previous.filter((item) => item.id !== id))
      if (restoredItem) {
        setMenuItems((previous) => [restoredItem, ...previous])
      }
      toast.success('Menu item restored.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to restore menu item.')
    } finally {
      setActiveRestoreId('')
    }
  }

  const openEditModal = (item) => {
    if (!item?.id) return
    setSelectedEditItem(item)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedEditItem(null)
    setActiveEditId('')
  }

  const handleEditMenuItem = async (payload) => {
    if (!selectedEditItem?.id) return false
    try {
      setActiveEditId(selectedEditItem.id)
      const response = await updateMyBusinessMenuItem(selectedEditItem.id, payload)
      const updatedItem = response?.data?.data
      if (updatedItem) {
        setMenuItems((previous) => previous.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      }
      toast.success('Menu item updated.')
      return true
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update menu item.')
      return false
    } finally {
      setActiveEditId('')
    }
  }

  return {
    form,
    menuItems,
    isAddingMenu,
    setIsAddingMenu,
    isImageLoading,
    isLoadingMenuItems,
    isSavingMenuItem,
    activeDeleteId,
    activeStockId,
    activeRestoreId,
    activeEditId,
    isEditModalOpen,
    selectedEditItem,
    deletedMenuItems,
    isDeletedModalOpen,
    setIsDeletedModalOpen,
    setField,
    handleImageSelection,
    handleRemoveImage,
    handleAddMenuItem,
    handleDeleteMenuItem,
    handleStockStatusChange,
    handleRestoreMenuItem,
    openEditModal,
    closeEditModal,
    handleEditMenuItem
  }
}
