import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { adminManageUsersFilterSchema } from '../shared/validators/adminManageUsers.validator'
import {
  deleteAdminUser as deleteAdminUserRequest,
  getAdminUsers,
  patchAdminUserWhitelist
} from '../services/auth/auth.service'
import { useAuth } from './useAuth.hook'
import { ADMIN_USERS_PAGE_SIZE } from '../components/ui/admin/manage-users/manageUsers.constants'
import { applyAdminUsersListResponse } from '../components/ui/admin/manage-users/manageUsersList.utils'

const defaultValues = {
  search: '',
  role: 'ALL',
  whitelisted: 'ALL'
}

export const useAdminManageUsers = () => {
  const { user: currentUser } = useAuth()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [whitelistBusyId, setWhitelistBusyId] = useState(null)
  const [deleteBusyId, setDeleteBusyId] = useState(null)

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
    const id = window.setTimeout(() => setDebouncedSearch(String(search || '').trim()), delayMs)
    return () => window.clearTimeout(id)
  }, [search])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedSearch, role, whitelisted])

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getAdminUsers({
        search: debouncedSearch,
        role,
        whitelisted,
        page,
        limit: ADMIN_USERS_PAGE_SIZE
      })
      applyAdminUsersListResponse(response, {
        setRows,
        setTotal,
        setTotalPages,
        setPage,
        currentPage: page
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load users.')
      setRows([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, role, whitelisted, page])

  useEffect(() => {
    load()
  }, [load])

  const toggleWhitelist = useCallback(async (userId, nextWhitelisted) => {
    try {
      setWhitelistBusyId(userId)
      await patchAdminUserWhitelist(userId, nextWhitelisted)
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, whitelisted: nextWhitelisted } : r)))
      toast.success(nextWhitelisted ? 'User is whitelisted.' : 'User removed from whitelist.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update whitelist.')
    } finally {
      setWhitelistBusyId(null)
    }
  }, [])

  const removeUser = useCallback(
    async (userId) => {
      const ok = window.confirm('Delete this user and related business data? This cannot be undone.')
      if (!ok) return
      try {
        setDeleteBusyId(userId)
        await deleteAdminUserRequest(userId)
        toast.success('User deleted.')
        const response = await getAdminUsers({
          search: debouncedSearch,
          role,
          whitelisted,
          page,
          limit: ADMIN_USERS_PAGE_SIZE
        })
        applyAdminUsersListResponse(response, {
          setRows,
          setTotal,
          setTotalPages,
          setPage,
          currentPage: page
        })
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Could not delete user.')
      } finally {
        setDeleteBusyId(null)
      }
    },
    [debouncedSearch, role, whitelisted, page]
  )

  const goPrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const goNextPage = useCallback(() => {
    setPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p))
  }, [totalPages])

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
