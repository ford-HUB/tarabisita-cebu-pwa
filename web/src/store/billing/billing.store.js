import { create } from 'zustand'
import { toast } from 'sonner'
import { getMyBusinessProfile, updateMyBusinessProfile } from '../../services/business/business.service'
import {
  createBusinessBillingCheckout,
  getMyBusinessBillingLedger,
  getSubscriptionCatalog
} from '../../services/billing/billing.service'
import {
  getBundledDefaultSubscriptionCatalog,
  normalizeRemoteSubscriptionCatalog
} from '../../shared/utils/subscriptionCatalog.utils'
import { buildUpdateProfilePayloadFromBillingForm } from '../../shared/utils/billingDisplay.utils'

export const useBillingStore = create((set, get) => ({
  profileData: null,
  isBillingProfileLoading: true,

  ledgerPayments: [],
  ledgerSubscriptions: [],
  isLedgerLoading: true,

  publicCatalog: null,
  publicCatalogLoading: true,
  publicCatalogLoadError: null,

  loadBillingAccountProfile: async () => {
    set({ isBillingProfileLoading: true })
    try {
      const response = await getMyBusinessProfile()
      set({ profileData: response?.data?.data ?? null })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business account for billing.')
      set({ profileData: null })
    } finally {
      set({ isBillingProfileLoading: false })
    }
  },

  loadLedger: async () => {
    set({ isLedgerLoading: true })
    try {
      const res = await getMyBusinessBillingLedger()
      const data = res?.data?.data
      set({
        ledgerPayments: Array.isArray(data?.payments) ? data.payments : [],
        ledgerSubscriptions: Array.isArray(data?.subscriptions) ? data.subscriptions : []
      })
    } catch {
      set({ ledgerPayments: [], ledgerSubscriptions: [] })
    } finally {
      set({ isLedgerLoading: false })
    }
  },

  createBillingCheckout: async ({ months, returnBaseUrl }) => {
    const response = await createBusinessBillingCheckout({
      months,
      returnBaseUrl
    })
    const checkoutUrl = response?.data?.data?.checkoutUrl
    if (!checkoutUrl) {
      throw new Error('Checkout URL is missing.')
    }
    return checkoutUrl
  },

  saveBillingAddressFromForm: async (trimmed) => {
    const profileData = get().profileData
    const payload = buildUpdateProfilePayloadFromBillingForm(profileData, trimmed)
    await updateMyBusinessProfile(payload)
    await get().loadBillingAccountProfile()
    await get().loadLedger()
  },

  fetchPublicSubscriptionCatalog: async () => {
    set({ publicCatalogLoading: true, publicCatalogLoadError: null })
    try {
      const res = await getSubscriptionCatalog()
      set({
        publicCatalog: normalizeRemoteSubscriptionCatalog(res?.data?.data),
        publicCatalogLoading: false
      })
    } catch (error) {
      set({
        publicCatalogLoadError: error,
        publicCatalog: getBundledDefaultSubscriptionCatalog(),
        publicCatalogLoading: false
      })
    }
  }
}))
