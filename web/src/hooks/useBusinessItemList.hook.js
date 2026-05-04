import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { useBusinessMenuItemsStore } from '../store/business/menuItems.store'
import {
  addMenuCategoryPreset,
  readMenuCategoryPresets,
  removeMenuCategoryPreset
} from '../shared/utils/menuCategoryPresets.utils'

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
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEditItem, setSelectedEditItem] = useState(null)
  const [menuCategoryPresets, setMenuCategoryPresets] = useState([])
  const [isSaveMenuCategoryPresetOpen, setIsSaveMenuCategoryPresetOpen] = useState(false)
  const [pendingMenuCategoryPreset, setPendingMenuCategoryPreset] = useState('')

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
    void useBusinessMenuItemsStore.getState().fetchMenuItems()
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) {
      setMenuCategoryPresets([])
      return
    }
    setMenuCategoryPresets(readMenuCategoryPresets(user._id))
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
    pickMenuCategoryPreset,
    handleCategoryFieldKeyDown,
    isSaveMenuCategoryPresetOpen,
    pendingMenuCategoryPreset,
    confirmSaveMenuCategoryPreset,
    dismissSaveMenuCategoryPreset,
    deleteMenuCategoryPreset
  }
}
