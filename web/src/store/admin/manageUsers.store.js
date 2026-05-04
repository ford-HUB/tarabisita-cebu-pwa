import { create } from 'zustand'
import { toast } from 'sonner'
import {
  deleteAdminUser as deleteAdminUserRequest,
  getAdminUsers,
  patchAdminUserWhitelist,
  sendAdminUserWarningEmail
} from '../../services/admin/users.service'
import { ADMIN_USERS_PAGE_SIZE } from '../../components/ui/admin/manage-users/manageUsers.constants'
import { applyAdminUsersListResponse } from '../../components/ui/admin/manage-users/manageUsersList.utils'

export const useAdminManageUsersStore = create((set, get) => ({
  rows: [],
  isLoading: true,
  page: 1,
  total: 0,
  totalPages: 0,
  debouncedSearch: '',
  whitelistBusyId: null,
  deleteBusyId: null,

  setRows: (updater) =>
    set((s) => ({
      rows: typeof updater === 'function' ? updater(s.rows) : updater
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setPage: (updater) =>
    set((s) => ({
      page: typeof updater === 'function' ? updater(s.page) : updater
    })),
  setTotal: (total) => set({ total }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch }),
  setWhitelistBusyId: (whitelistBusyId) => set({ whitelistBusyId }),
  setDeleteBusyId: (deleteBusyId) => set({ deleteBusyId }),

  fetchList: async ({ role, whitelisted }) => {
    const s = get()
    set({ isLoading: true })
    try {
      const response = await getAdminUsers({
        search: s.debouncedSearch,
        role,
        whitelisted,
        page: s.page,
        limit: ADMIN_USERS_PAGE_SIZE
      })
      applyAdminUsersListResponse(response, {
        setRows: (rows) => set({ rows }),
        setTotal: (total) => set({ total }),
        setTotalPages: (totalPages) => set({ totalPages }),
        setPage: (p) =>
          set((state) => ({
            page: typeof p === 'function' ? p(state.page) : p
          })),
        currentPage: s.page
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load users.')
      set({ rows: [], total: 0, totalPages: 0 })
    } finally {
      set({ isLoading: false })
    }
  },

  toggleWhitelist: async ({ userId, nextWhitelisted, role, whitelisted }) => {
    set({ whitelistBusyId: userId })
    try {
      await patchAdminUserWhitelist(userId, nextWhitelisted)
      set((state) => ({
        rows: state.rows.map((r) => (r.id === userId ? { ...r, whitelisted: nextWhitelisted } : r)),
        whitelistBusyId: null
      }))
      toast.success(nextWhitelisted ? 'User is whitelisted.' : 'User removed from whitelist.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update whitelist.')
      set({ whitelistBusyId: null })
    }
  },

  sendUserWarningEmail: async (userId, formData) => {
    await sendAdminUserWarningEmail(userId, formData)
  },

  deleteUser: async ({ userId, role, whitelisted }) => {
    const ok = window.confirm('Delete this user and related business data? This cannot be undone.')
    if (!ok) return
    set({ deleteBusyId: userId })
    try {
      await deleteAdminUserRequest(userId)
      toast.success('User deleted.')
      const s = get()
      const response = await getAdminUsers({
        search: s.debouncedSearch,
        role,
        whitelisted,
        page: s.page,
        limit: ADMIN_USERS_PAGE_SIZE
      })
      applyAdminUsersListResponse(response, {
        setRows: (rows) => set({ rows }),
        setTotal: (total) => set({ total }),
        setTotalPages: (totalPages) => set({ totalPages }),
        setPage: (p) =>
          set((state) => ({
            page: typeof p === 'function' ? p(state.page) : p
          })),
        currentPage: s.page
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not delete user.')
    } finally {
      set({ deleteBusyId: null })
    }
  }
}))
