import { useCallback, useEffect, useLayoutEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useShallow } from 'zustand/react/shallow'
import { adminManageUsersFilterSchema } from '../shared/validators/adminManageUsers.validator'
import { useAuth } from './useAuth.hook'
import { ADMIN_USERS_PAGE_SIZE } from '../components/ui/admin/manage-users/manageUsers.constants'
import { useAdminManageUsersStore } from '../store/admin/manageUsers.store'

const defaultValues = {
  search: '',
  role: 'ALL',
  whitelisted: 'ALL'
}

export const useAdminManageUsers = () => {
  const { user: currentUser } = useAuth()
  const { rows, isLoading, page, total, totalPages, debouncedSearch, whitelistBusyId, deleteBusyId } =
    useAdminManageUsersStore(
      useShallow((s) => ({
        rows: s.rows,
        isLoading: s.isLoading,
        page: s.page,
        total: s.total,
        totalPages: s.totalPages,
        debouncedSearch: s.debouncedSearch,
        whitelistBusyId: s.whitelistBusyId,
        deleteBusyId: s.deleteBusyId
      }))
    )

  const {
    register,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminManageUsersFilterSchema),
    defaultValues,
    mode: 'onChange'
  })

  const [search, role, whitelisted] = watch(['search', 'role', 'whitelisted'])

  useEffect(() => {
    const delayMs = String(search || '').trim() === '' ? 0 : 350
    const id = window.setTimeout(
      () => useAdminManageUsersStore.getState().setDebouncedSearch(String(search || '').trim()),
      delayMs
    )
    return () => window.clearTimeout(id)
  }, [search])

  useLayoutEffect(() => {
    useAdminManageUsersStore.getState().setPage(1)
  }, [debouncedSearch, role, whitelisted])

  const load = useCallback(async () => {
    await useAdminManageUsersStore.getState().fetchList({ role, whitelisted })
  }, [debouncedSearch, role, whitelisted, page])

  useEffect(() => {
    void load()
  }, [load])

  const toggleWhitelist = useCallback(async (userId, nextWhitelisted) => {
    await useAdminManageUsersStore.getState().toggleWhitelist({ userId, nextWhitelisted, role, whitelisted })
  }, [role, whitelisted])

  const removeUser = useCallback(
    async (userId) => {
      await useAdminManageUsersStore.getState().deleteUser({ userId, role, whitelisted })
    },
    [role, whitelisted]
  )

  const goPrevPage = useCallback(() => {
    useAdminManageUsersStore.getState().setPage((p) => Math.max(1, p - 1))
  }, [])

  const goNextPage = useCallback(() => {
    useAdminManageUsersStore.getState().setPage((p) => {
      const { totalPages } = useAdminManageUsersStore.getState()
      return totalPages > 0 ? Math.min(totalPages, p + 1) : p
    })
  }, [])

  return {
    register,
    control,
    watch,
    reset,
    errors,
    rows,
    isLoading,
    page,
    limit: ADMIN_USERS_PAGE_SIZE,
    total,
    totalPages,
    onPrevPage: goPrevPage,
    onNextPage: goNextPage,
    currentUserId: currentUser?._id ? String(currentUser._id) : '',
    whitelistBusyId,
    deleteBusyId,
    toggleWhitelist,
    removeUser
  }
}
