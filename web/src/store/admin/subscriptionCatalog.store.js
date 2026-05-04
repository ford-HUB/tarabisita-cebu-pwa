import { create } from 'zustand'
import { toast } from 'sonner'
import { getSubscriptionCatalog } from '../../services/billing/billing.service'
import { putManageSubscriptionCatalog } from '../../services/admin/businessOperations.service'
import {
  getBundledDefaultSubscriptionCatalog,
  normalizeRemoteSubscriptionCatalog
} from '../../shared/utils/subscriptionCatalog.utils'

const normalizeFreeTierForApi = (freeTier) =>
  (Array.isArray(freeTier) ? freeTier : []).map((entry) => {
    if (Array.isArray(entry)) {
      return [String(entry[0] ?? ''), String(entry[1] ?? '')]
    }
    return [String(entry?.[0] ?? entry?.['0'] ?? ''), String(entry?.[1] ?? entry?.['1'] ?? '')]
  })

export const useAdminSubscriptionCatalogStore = create((set) => ({
  isPageLoading: true,
  isSaving: false,

  setIsPageLoading: (isPageLoading) => set({ isPageLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),

  loadRemoteCatalog: async () => {
    set({ isPageLoading: true })
    try {
      const res = await getSubscriptionCatalog()
      return { ok: true, data: normalizeRemoteSubscriptionCatalog(res?.data?.data) }
    } catch {
      toast.error('Could not load catalog from the server; showing bundled defaults.')
      return { ok: false, data: getBundledDefaultSubscriptionCatalog() }
    } finally {
      set({ isPageLoading: false })
    }
  },

  saveRemoteCatalog: async (values) => {
    set({ isSaving: true })
    try {
      const payload = {
        ...values,
        freeTier: normalizeFreeTierForApi(values.freeTier)
      }
      const res = await putManageSubscriptionCatalog(payload)
      toast.success('Subscription catalog saved.')
      return { ok: true, data: normalizeRemoteSubscriptionCatalog(res?.data?.data) }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save catalog.')
      return { ok: false }
    } finally {
      set({ isSaving: false })
    }
  }
}))
