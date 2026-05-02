import { useMemo } from 'react'

export const useBusinessAccess = (user) => {
  const isBusinessVerified = useMemo(() => {
    const verificationStatus =
      user?.businessVerificationStatus ||
      user?.verificationStatus ||
      user?.business?.verificationStatus ||
      ''

    const normalizedStatus = String(verificationStatus).trim().toUpperCase()
    return normalizedStatus === 'VERIFIED'
  }, [user])

  const isProfileComplete = useMemo(() => {
    const requiredFields = [user?.name, user?.email, user?.phone, user?.businessName, user?.address]
    const hasAllProfileFields = requiredFields.every(
      (value) => typeof value === 'string' && value.trim().length > 0
    )
    
    if (user?.role === 'BUSINESS' && !hasAllProfileFields) {
      return true
    }

    return hasAllProfileFields
  }, [user])

  return {
    isBusinessVerified,
    isProfileComplete,
  }
}
