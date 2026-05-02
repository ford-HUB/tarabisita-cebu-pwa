import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getMyBusinessProfile } from '../services/business/business.service'
import {
  getBillingAccountDisplayRows,
  mapProfileToBillingAddressFormDefaults
} from '../shared/utils/billingDisplay.utils'

export const useBusinessBillingProfile = () => {
  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getMyBusinessProfile()
      setProfileData(response?.data?.data ?? null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business account for billing.')
      setProfileData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const displayRows = useMemo(() => getBillingAccountDisplayRows(profileData), [profileData])

  const billingAddressFormDefaults = useMemo(
    () => mapProfileToBillingAddressFormDefaults(profileData),
    [profileData]
  )

  return {
    profileData,
    displayRows,
    billingAddressFormDefaults,
    isLoading,
    refetchProfile: loadProfile
  }
}
