import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getMyBusinessSettings,
  updateMyBusinessSettings,
  verifyMyBusinessPaymentMethod,
  createMyBusinessPaymentMethodSetupCheckout
} from '../../services/business/business.service'

const DEFAULT_SETTINGS = {
  receiveOrderEmailAlerts: true,
  receiveChatNotifications: true,
  autoAcceptOrders: false,
  prepTimeMinutes: 20,
  lowStockThreshold: 10,
  paymentMethods: {
    GCASH: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    MAYA: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    GRAB_PAY: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    CARD: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null }
  }
}

const normalizeSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  paymentMethods: {
    ...DEFAULT_SETTINGS.paymentMethods,
    ...(settings?.paymentMethods || {})
  }
})

export const useBusinessSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  baselineSettings: DEFAULT_SETTINGS,
  isLoadingSettings: false,
  isSavingSettings: false,
  isVerifyingPaymentMethod: false,
  isStartingPaymentMethodSetup: false,
  activeSetupMethodKey: '',
  setupVerificationMetaByMethod: {},

  loadSettings: async () => {
    set({ isLoadingSettings: true })
    try {
      const response = await getMyBusinessSettings()
      const hydratedSettings = normalizeSettings(response?.data?.data)
      set({
        settings: hydratedSettings,
        baselineSettings: hydratedSettings,
        isLoadingSettings: false
      })
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business settings.')
      set({ isLoadingSettings: false })
      return { ok: false }
    }
  },

  updateSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value
      }
    }))
  },

  updatePaymentMethodSetting: (methodKey, key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        paymentMethods: {
          ...(state.settings?.paymentMethods || {}),
          [methodKey]: {
            ...(state.settings?.paymentMethods?.[methodKey] || {}),
            [key]: value
          }
        }
      }
    }))
  },

  verifyPaymentMethod: async (methodKey) => {
    const settings = get().settings
    const row = settings?.paymentMethods?.[methodKey] || {}
    const accountName = String(row.accountName || '').trim()
    const accountNumber = String(row.accountNumber || '').trim()
    if (!accountName || !accountNumber) {
      toast.error('Account name and number are required before verification.')
      return { ok: false }
    }

    set({ isVerifyingPaymentMethod: true })
    try {
      const response = await verifyMyBusinessPaymentMethod({
        methodCode: methodKey,
        accountName,
        accountNumber
      })
      const verifiedAt = response?.data?.data?.verifiedAt || new Date().toISOString()
      set((state) => ({
        settings: {
          ...state.settings,
          paymentMethods: {
            ...state.settings.paymentMethods,
            [methodKey]: {
              ...(state.settings.paymentMethods?.[methodKey] || {}),
              isVerified: true,
              verifiedAt
            }
          }
        }
      }))
      toast.success(response?.data?.message || `${methodKey} verified.`)
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Payment method verification failed.')
      return { ok: false }
    } finally {
      set({ isVerifyingPaymentMethod: false })
    }
  },

  startPaymentMethodSetupCheckout: async (methodKey) => {
    set({ isStartingPaymentMethodSetup: true, activeSetupMethodKey: String(methodKey || '') })
    try {
      const response = await createMyBusinessPaymentMethodSetupCheckout({
        methodCode: methodKey,
        returnBaseUrl: typeof window !== 'undefined' ? window.location.origin : ''
      })
      const verificationAmountRaw = response?.data?.data?.verificationAmount
      const currency = String(response?.data?.data?.currency || 'PHP')
      const verificationAmount = Number(verificationAmountRaw)
      if (Number.isFinite(verificationAmount) && verificationAmount > 0) {
        set((state) => ({
          setupVerificationMetaByMethod: {
            ...(state.setupVerificationMetaByMethod || {}),
            [methodKey]: { verificationAmount, currency }
          }
        }))
      }
      return {
        ok: true,
        checkoutUrl: response?.data?.data?.checkoutUrl || '',
        verificationAmount: Number.isFinite(verificationAmount) ? verificationAmount : null,
        currency
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to start setup checkout.')
      return { ok: false, checkoutUrl: '', verificationAmount: null, currency: 'PHP' }
    } finally {
      set({ isStartingPaymentMethodSetup: false, activeSetupMethodKey: '' })
    }
  },

  resetToBaseline: () => {
    set((state) => ({ settings: state.baselineSettings }))
    toast('Changes reverted.')
  },

  saveSettings: async () => {
    set({ isSavingSettings: true })
    try {
      const payload = normalizeSettings(get().settings)
      const response = await updateMyBusinessSettings(payload)
      const nextSettings = normalizeSettings(response?.data?.data || payload)
      set({
        settings: nextSettings,
        baselineSettings: nextSettings
      })
      toast.success(response?.data?.message || 'Business settings saved.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save business settings.')
      return { ok: false }
    } finally {
      set({ isSavingSettings: false })
    }
  }
}))
