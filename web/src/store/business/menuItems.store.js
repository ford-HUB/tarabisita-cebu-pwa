import { create } from 'zustand'
import { toast } from 'sonner'
import {
  createMyBusinessMenuItem,
  deleteMyBusinessMenuItem,
  getMyBusinessMenuItems,
  restoreMyBusinessMenuItem,
  updateMyBusinessMenuItem,
  updateMyBusinessMenuItemStock
} from '../../services/business/business.service'

export const useBusinessMenuItemsStore = create((set) => ({
  isLoadingMenuItems: false,
  isSavingMenuItem: false,
  activeDeleteId: '',
  activeStockId: '',
  activeRestoreId: '',
  activeEditId: '',
  menuItems: [],
  deletedMenuItems: [],

  setIsLoadingMenuItems: (isLoadingMenuItems) => set({ isLoadingMenuItems }),
  setIsSavingMenuItem: (isSavingMenuItem) => set({ isSavingMenuItem }),
  setActiveDeleteId: (activeDeleteId) => set({ activeDeleteId }),
  setActiveStockId: (activeStockId) => set({ activeStockId }),
  setActiveRestoreId: (activeRestoreId) => set({ activeRestoreId }),
  setActiveEditId: (activeEditId) => set({ activeEditId }),
  setMenuItems: (updater) =>
    set((s) => ({
      menuItems: typeof updater === 'function' ? updater(s.menuItems) : updater
    })),
  setDeletedMenuItems: (updater) =>
    set((s) => ({
      deletedMenuItems: typeof updater === 'function' ? updater(s.deletedMenuItems) : updater
    })),
  clearMenuLists: () => set({ menuItems: [], deletedMenuItems: [] }),

  fetchMenuItems: async () => {
    set({ isLoadingMenuItems: true })
    try {
      const response = await getMyBusinessMenuItems({ includeDeleted: true })
      const allItems = Array.isArray(response?.data?.data) ? response.data.data : []
      set({
        menuItems: allItems.filter((item) => !item.isDeleted),
        deletedMenuItems: allItems.filter((item) => item.isDeleted),
        isLoadingMenuItems: false
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load menu items.')
      set({ isLoadingMenuItems: false })
    }
  },

  createMenuItem: async (payload) => {
    set({ isSavingMenuItem: true })
    try {
      const response = await createMyBusinessMenuItem(payload)
      const createdItem = response?.data?.data
      if (createdItem) {
        set((s) => ({ menuItems: [createdItem, ...s.menuItems] }))
      }
      toast.success('Menu item added successfully.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add menu item.')
      return { ok: false }
    } finally {
      set({ isSavingMenuItem: false })
    }
  },

  deleteMenuItem: async (id) => {
    set({ activeDeleteId: id })
    try {
      const response = await deleteMyBusinessMenuItem(id)
      set((s) => {
        const deletedItem = s.menuItems.find((item) => item.id === id)
        return {
          menuItems: s.menuItems.filter((item) => item.id !== id),
          deletedMenuItems: deletedItem
            ? [{ ...deletedItem, isDeleted: true, deletedAt: new Date().toISOString() }, ...s.deletedMenuItems]
            : s.deletedMenuItems
        }
      })
      toast.success(response?.data?.message || 'Menu item moved to deleted list.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete menu item.')
    } finally {
      set({ activeDeleteId: '' })
    }
  },

  updateStock: async (id, stockStatus) => {
    set({ activeStockId: id })
    try {
      const response = await updateMyBusinessMenuItemStock(id, stockStatus)
      const updatedItem = response?.data?.data
      if (updatedItem) {
        set((s) => ({
          menuItems: s.menuItems.map((item) => (item.id === id ? updatedItem : item))
        }))
      }
      toast.success(stockStatus === 'OUT_OF_STOCK' ? 'Marked as out of stock.' : 'Marked as available to order.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update menu status.')
    } finally {
      set({ activeStockId: '' })
    }
  },

  restoreMenuItem: async (id) => {
    set({ activeRestoreId: id })
    try {
      const response = await restoreMyBusinessMenuItem(id)
      const restoredItem = response?.data?.data
      set((s) => ({
        deletedMenuItems: s.deletedMenuItems.filter((item) => item.id !== id),
        menuItems: restoredItem ? [restoredItem, ...s.menuItems] : s.menuItems
      }))
      toast.success('Menu item restored.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to restore menu item.')
    } finally {
      set({ activeRestoreId: '' })
    }
  },

  updateMenuItem: async (menuItemId, payload) => {
    set({ activeEditId: menuItemId })
    try {
      const response = await updateMyBusinessMenuItem(menuItemId, payload)
      const updatedItem = response?.data?.data
      if (updatedItem) {
        set((s) => ({
          menuItems: s.menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        }))
      }
      toast.success('Menu item updated.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update menu item.')
      return { ok: false }
    } finally {
      set({ activeEditId: '' })
    }
  }
}))
