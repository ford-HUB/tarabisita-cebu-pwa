import { toast } from 'sonner'
import { useEffect, useMemo } from 'react'
import { useBusinessSettingsStore } from '../store/business/businessSettings.store'

export const useBusinessSettings = () => {
  const {
    settings,
    baselineSettings,
    isLoadingSettings,
    isSavingSettings,
    isVerifyingPaymentMethod,
    isStartingPaymentMethodSetup,
    activeSetupMethodKey,
    setupVerificationMetaByMethod,
    loadSettings,
    updateSetting,
    updatePaymentMethodSetting,
    verifyPaymentMethod,
    startPaymentMethodSetupCheckout,
    saveSettings,
    resetToBaseline
  } = useBusinessSettingsStore()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(baselineSettings)
  }, [settings, baselineSettings])

  const updateBooleanSetting = (key) => {
    updateSetting(key, !settings[key])
  }

  const updateSelectSetting = (key, value) => {
    updateSetting(key, Number(value))
  }

  const resetToSaved = () => {
    resetToBaseline()
  }

  const updatePaymentMethodToggle = (methodKey) => {
    const current = settings?.paymentMethods?.[methodKey]
    const nextEnabled = !(current?.enabled === true)
    if (nextEnabled && !current?.isVerified) {
      toast.error('Configure and verify this payment method first in Xendit.')
      return
    }
    updatePaymentMethodSetting(methodKey, 'enabled', nextEnabled)
  }

  const updatePaymentMethodField = (methodKey, key, value) => {
    updatePaymentMethodSetting(methodKey, key, String(value || ''))
    if (key === 'accountName' || key === 'accountNumber') {
      updatePaymentMethodSetting(methodKey, 'isVerified', false)
      updatePaymentMethodSetting(methodKey, 'verifiedAt', null)
    }
  }

  return {
    settings,
    loadSettings,
    isLoadingSettings,
    isSavingSettings,
    isVerifyingPaymentMethod,
    isStartingPaymentMethodSetup,
    activeSetupMethodKey,
    setupVerificationMetaByMethod,
    hasUnsavedChanges,
    updateBooleanSetting,
    updateSelectSetting,
    updatePaymentMethodToggle,
    updatePaymentMethodField,
    verifyPaymentMethod,
    startPaymentMethodSetupCheckout,
    saveSettings,
    resetToSaved
  }
}
