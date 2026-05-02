import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getAdminBusinessPartners } from '../services/business/business.service'

const PLAN_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  INACTIVE: 'INACTIVE'
}

const mapRow = (item) => ({
  id: String(item?._id || ''),
  name: item?.name || 'Unnamed business',
  logo: item?.logo || '',
  ownerName: item?.ownerName || '—',
  ownerEmail: item?.ownerEmail || '—',
  phone: item?.phone || '—',
  category: item?.category || '—',
  verificationStatus: item?.verificationStatus || '—',
  firstPartneredAt: item?.firstPartneredAt || null,
  planId: item?.subscription?.planId || null,
  planMonths: item?.subscription?.months ?? null,
  effectiveStatus: item?.subscription?.effectiveStatus || 'INACTIVE',
  expiresAt: item?.subscription?.expiresAt || null
})

export const useAdminBusinessPartners = () => {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState(PLAN_FILTER.ALL)
  const [isLoading, setIsLoading] = useState(true)

  const loadPartners = async () => {
    try {
      setIsLoading(true)
      const response = await getAdminBusinessPartners()
      const list = Array.isArray(response?.data?.data) ? response.data.data : []
      setRows(list.map(mapRow))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business partners.')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const requestId = requestAnimationFrame(() => {
      void loadPartners()
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

  return {
    isLoading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    planFilterOptions: PLAN_FILTER,
    filteredRows,
    reload: loadPartners
  }
}
