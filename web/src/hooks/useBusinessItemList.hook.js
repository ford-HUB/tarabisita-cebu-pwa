import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { useBusinessMenuItemsStore } from '../store/business/menuItems.store'
import {
  getMyBusinessProfile,
  updateMyResortListingStock
} from '../services/business/business.service'
import {
  addMenuCategoryPreset,
  readMenuCategoryPresets,
  removeMenuCategoryPreset
} from '../shared/utils/menuCategoryPresets.utils'
import {
  addMenuFlavorPreset,
  readMenuFlavorPresets,
  removeMenuFlavorPreset
} from '../shared/utils/menuFlavorPresets.utils'

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

const createBlankForm = ({ isAccommodationBusiness = false } = {}) => ({
  name: '',
  description: '',
  flavor: '',
  price: '',
  category: '',
  preparationTime: '',
  servingSize: '',
  spiceLevel: isAccommodationBusiness ? 'Standard' : 'No Spice',
  allergens: '',
  addOns: [],
  isAvailable: true,
  images: []
})

export const useBusinessItemList = (user, { isAccommodationBusiness = false } = {}) => {
  const normalizedCategory = String(user?.businessCategory || '').trim().toUpperCase()
  const isMenuItemsSupported = normalizedCategory === 'RESTAURANT'
  const [form, setForm] = useState(() => createBlankForm({ isAccommodationBusiness }))
  const [isAddingMenu, setIsAddingMenu] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEditItem, setSelectedEditItem] = useState(null)
  const [menuCategoryPresets, setMenuCategoryPresets] = useState([])
  const [menuFlavorPresets, setMenuFlavorPresets] = useState([])
  const [isSaveMenuCategoryPresetOpen, setIsSaveMenuCategoryPresetOpen] = useState(false)
  const [pendingMenuCategoryPreset, setPendingMenuCategoryPreset] = useState('')
  const [isSaveMenuFlavorPresetOpen, setIsSaveMenuFlavorPresetOpen] = useState(false)
  const [pendingMenuFlavorPreset, setPendingMenuFlavorPreset] = useState('')

  const {
    isLoadingMenuItems,
    isSavingMenuItem,
    activeDeleteId,
    activeStockId,
    activeRestoreId,
    activeEditId,
    menuItems,
    deletedMenuItems
  } = useBusinessMenuItemsStore(
    useShallow((s) => ({
      isLoadingMenuItems: s.isLoadingMenuItems,
      isSavingMenuItem: s.isSavingMenuItem,
      activeDeleteId: s.activeDeleteId,
      activeStockId: s.activeStockId,
      activeRestoreId: s.activeRestoreId,
      activeEditId: s.activeEditId,
      menuItems: s.menuItems,
      deletedMenuItems: s.deletedMenuItems
    }))
  )

  useEffect(() => {
    if (!user?._id) {
      useBusinessMenuItemsStore.getState().clearMenuLists()
      return
    }
    if (!isMenuItemsSupported) {
      const run = async () => {
        try {
          useBusinessMenuItemsStore.getState().setIsLoadingMenuItems(true)
          const response = await getMyBusinessProfile({ businessCategory: user?.businessCategory })
          const business = response?.data?.data
          const allItems = Array.isArray(business?.menuItems) ? business.menuItems : []
          const normalized = allItems.map((item) => ({
            ...item,
            id: item?.id || item?._id || ''
          }))
          useBusinessMenuItemsStore.getState().setMenuItems(normalized.filter((item) => !item?.isDeleted))
          useBusinessMenuItemsStore.getState().setDeletedMenuItems(
            normalized.filter((item) => item?.isDeleted)
          )
        } catch {
          useBusinessMenuItemsStore.getState().clearMenuLists()
        } finally {
          useBusinessMenuItemsStore.getState().setIsLoadingMenuItems(false)
        }
      }
      void run()
      return
    }
    void useBusinessMenuItemsStore.getState().fetchMenuItems()
  }, [user?._id, isMenuItemsSupported])

  useEffect(() => {
    if (!user?._id) {
      setMenuCategoryPresets([])
      setMenuFlavorPresets([])
      return
    }
    setMenuCategoryPresets(readMenuCategoryPresets(user._id))
    setMenuFlavorPresets(readMenuFlavorPresets(user._id))
  }, [user?._id])

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const pickMenuCategoryPreset = (label) => {
    setField('category', label)
  }

  const handleCategoryFieldKeyDown = (event) => {
    if (event.key !== 'Enter') return
    const value = form.category.trim()
    if (!value) return
    event.preventDefault()
    const exists = menuCategoryPresets.some((c) => c.toLowerCase() === value.toLowerCase())
    if (exists) return
    setPendingMenuCategoryPreset(value)
    setIsSaveMenuCategoryPresetOpen(true)
  }

  const pickMenuFlavorPreset = (label) => {
    setField('flavor', label)
  }

  const handleFlavorFieldKeyDown = (event) => {
    if (event.key !== 'Enter') return
    const value = form.flavor.trim()
    if (!value) return
    event.preventDefault()
    const exists = menuFlavorPresets.some((entry) => entry.toLowerCase() === value.toLowerCase())
    if (exists) return
    setPendingMenuFlavorPreset(value)
    setIsSaveMenuFlavorPresetOpen(true)
  }

  const confirmSaveMenuCategoryPreset = () => {
    if (!user?._id || !pendingMenuCategoryPreset.trim()) {
      setIsSaveMenuCategoryPresetOpen(false)
      setPendingMenuCategoryPreset('')
      return
    }
    const next = addMenuCategoryPreset(user._id, pendingMenuCategoryPreset)
    setMenuCategoryPresets(next)
    setIsSaveMenuCategoryPresetOpen(false)
    setPendingMenuCategoryPreset('')
  }

  const dismissSaveMenuCategoryPreset = () => {
    setIsSaveMenuCategoryPresetOpen(false)
    setPendingMenuCategoryPreset('')
  }

  const confirmSaveMenuFlavorPreset = () => {
    if (!user?._id || !pendingMenuFlavorPreset.trim()) {
      setIsSaveMenuFlavorPresetOpen(false)
      setPendingMenuFlavorPreset('')
      return
    }
    const next = addMenuFlavorPreset(user._id, pendingMenuFlavorPreset)
    setMenuFlavorPresets(next)
    setIsSaveMenuFlavorPresetOpen(false)
    setPendingMenuFlavorPreset('')
  }

  const dismissSaveMenuFlavorPreset = () => {
    setIsSaveMenuFlavorPresetOpen(false)
    setPendingMenuFlavorPreset('')
  }

  const deleteMenuCategoryPreset = (label) => {
    if (!user?._id) return
    const next = removeMenuCategoryPreset(user._id, label)
    setMenuCategoryPresets(next)
    setForm((previous) => {
      if (previous.category.trim().toLowerCase() === String(label).trim().toLowerCase()) {
        return { ...previous, category: '' }
      }
      return previous
    })
  }

  const deleteMenuFlavorPreset = (label) => {
    if (!user?._id) return
    const next = removeMenuFlavorPreset(user._id, label)
    setMenuFlavorPresets(next)
    setForm((previous) => {
      if (previous.flavor.trim().toLowerCase() === String(label).trim().toLowerCase()) {
        return { ...previous, flavor: '' }
      }
      return previous
    })
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
    setForm(createBlankForm({ isAccommodationBusiness }))
  }

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return isAccommodationBusiness
        ? 'Listing title must be at least 2 characters.'
        : 'Menu name must be at least 2 characters.'
    }
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters.'
    if (form.flavor.trim().length < 2) {
      return isAccommodationBusiness ? 'Accommodation type is required.' : 'Flavor profile is required.'
    }
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return 'Price must be greater than zero.'
    if (form.images.length < 2) {
      return isAccommodationBusiness ? 'Add at least 2 listing photos.' : 'Add at least 2 menu photos.'
    }
    return ''
  }

  const handleAddMenuItem = async () => {
    const validationMessage = validateForm()
    if (validationMessage) {
      toast.error(validationMessage)
      return false
    }

    const result = await useBusinessMenuItemsStore.getState().createMenuItem({
      name: form.name.trim(),
      description: form.description.trim(),
      flavor: form.flavor.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      preparationTime: form.preparationTime.trim(),
      servingSize: form.servingSize.trim(),
      spiceLevel: form.spiceLevel,
      allergens: form.allergens.trim(),
      addOns: Array.isArray(form.addOns) ? form.addOns : [],
      isAvailable: Boolean(form.isAvailable),
      images: form.images
    })
    if (result?.ok) {
      resetForm()
      setIsAddingMenu(false)
    }
    return Boolean(result?.ok)
  }

  const handleDeleteMenuItem = async (id) => {
    await useBusinessMenuItemsStore.getState().deleteMenuItem(id)
  }

  const handleStockStatusChange = async (id, stockStatus) => {
    if (!isMenuItemsSupported) {
      useBusinessMenuItemsStore.getState().setActiveStockId(id)
      try {
        const response = await updateMyResortListingStock(id, stockStatus)
        const updatedItem = response?.data?.data
        if (updatedItem?.id) {
          useBusinessMenuItemsStore.getState().setMenuItems((items) =>
            items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
          )
        }
        toast.success(stockStatus === 'OUT_OF_STOCK' ? 'Marked as unavailable.' : 'Marked as available to book.')
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to update listing availability.')
      } finally {
        useBusinessMenuItemsStore.getState().setActiveStockId('')
      }
      return
    }
    await useBusinessMenuItemsStore.getState().updateStock(id, stockStatus)
  }

  const handleRestoreMenuItem = async (id) => {
    await useBusinessMenuItemsStore.getState().restoreMenuItem(id)
  }

  const openEditModal = (item) => {
    if (!item?.id) return
    setSelectedEditItem(item)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedEditItem(null)
    useBusinessMenuItemsStore.getState().setActiveEditId('')
  }

  const handleEditMenuItem = async (payload) => {
    if (!selectedEditItem?.id) return false
    const result = await useBusinessMenuItemsStore
      .getState()
      .updateMenuItem(selectedEditItem.id, payload)
    return Boolean(result?.ok)
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
    handleEditMenuItem,
    menuCategoryPresets,
    menuFlavorPresets,
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
  }
}
