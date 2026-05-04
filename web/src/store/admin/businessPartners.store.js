import { create } from 'zustand'
import { toast } from 'sonner'
import { getAdminBusinessPartners } from '../../services/admin/businessOperations.service'

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

export const useAdminBusinessPartnersStore = create((set) => ({
  rows: [],
  search: '',
  planFilter: 'ALL',
  isLoading: true,

  setRows: (rows) => set({ rows }),
  setSearch: (search) => set({ search }),
  setPlanFilter: (planFilter) => set({ planFilter }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchPartners: async () => {
    set({ isLoading: true })
    try {
      const response = await getAdminBusinessPartners()
      const list = Array.isArray(response?.data?.data) ? response.data.data : []
      set({ rows: list.map(mapRow), isLoading: false })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business partners.')
      set({ rows: [], isLoading: false })
    }
  }
}))
