import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAdminBusinessPartnersStore } from '../store/admin/businessPartners.store'

const PLAN_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  INACTIVE: 'INACTIVE'
}

export const useAdminBusinessPartners = () => {
  const { rows, search, planFilter, isLoading } = useAdminBusinessPartnersStore(
    useShallow((s) => ({
      rows: s.rows,
      search: s.search,
      planFilter: s.planFilter,
      isLoading: s.isLoading
    }))
  )

  useEffect(() => {
    const requestId = requestAnimationFrame(() => {
      void useAdminBusinessPartnersStore.getState().fetchPartners()
    })
    return () => cancelAnimationFrame(requestId)
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (planFilter !== PLAN_FILTER.ALL && row.effectiveStatus !== planFilter) {
        return false
      }
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        row.ownerName.toLowerCase().includes(q) ||
        row.ownerEmail.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      )
    })
  }, [rows, search, planFilter])

  const setSearch = (v) => useAdminBusinessPartnersStore.getState().setSearch(v)
  const setPlanFilter = (v) => useAdminBusinessPartnersStore.getState().setPlanFilter(v)

  return {
    isLoading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    planFilterOptions: PLAN_FILTER,
    filteredRows,
    reload: () => useAdminBusinessPartnersStore.getState().fetchPartners()
  }
}
