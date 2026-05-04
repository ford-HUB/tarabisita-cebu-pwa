import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  getBillingAccountDisplayRows,
  mapProfileToBillingAddressFormDefaults
} from '../shared/utils/billingDisplay.utils'
import { useBillingStore } from '../store/billing/billing.store'

/** Reads billing account snapshot from store (loaded by `useBusinessBilling`). */
export const useBusinessBillingProfile = () => {
  const { profileData, isBillingProfileLoading } = useBillingStore(
    useShallow((s) => ({
      profileData: s.profileData,
      isBillingProfileLoading: s.isBillingProfileLoading
    }))
  )

  const refetchProfile = useCallback(() => {
    return useBillingStore.getState().loadBillingAccountProfile()
  }, [])

  const displayRows = useMemo(() => getBillingAccountDisplayRows(profileData), [profileData])

  const billingAddressFormDefaults = useMemo(
    () => mapProfileToBillingAddressFormDefaults(profileData),
    [profileData]
  )

  return {
    profileData,
    displayRows,
    billingAddressFormDefaults,
    isLoading: isBillingProfileLoading,
    refetchProfile
  }
}
