import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getMyBusinessProfile,
  updateMyBusinessProfile,
  uploadMyBusinessBannerImage,
  uploadMyBusinessProfileImage
} from '../../services/business/business.service'

export const useBusinessInterfaceStore = create((set) => ({
  businessProfile: null,
  isLoadingProfile: true,
  isSavingHeader: false,

  setBusinessProfile: (businessProfile) => set({ businessProfile }),
  setIsLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
  setIsSavingHeader: (isSavingHeader) => set({ isSavingHeader }),

  loadInterfaceProfile: async ({ businessCategory } = {}) => {
    set({ isLoadingProfile: true })
    try {
      const response = await getMyBusinessProfile({ businessCategory })
      const profile = response?.data?.data
      set({ businessProfile: profile || null, isLoadingProfile: false })
      return { ok: true, profile: profile || null }
    } catch {
      set({ businessProfile: null, isLoadingProfile: false })
      return { ok: false, profile: null }
    }
  },

  saveHeaderBundle: async ({
    hasTextHeaderChanges,
    businessNameInput,
    businessDescriptionInput,
    logoFileData,
    bannerFileData,
    businessProfile,
    user,
    categoryLabel
  }) => {
    if (!businessProfile) {
      toast.error('Business profile is not ready yet.')
      return { ok: false }
    }
    if (hasTextHeaderChanges && businessNameInput.trim().length < 2) {
      toast.error('Business name must be at least 2 characters.')
      return { ok: false }
    }
    if (hasTextHeaderChanges && businessDescriptionInput.trim().length < 10) {
      toast.error('Description must be at least 10 characters.')
      return { ok: false }
    }

    set({ isSavingHeader: true })
    try {
      let updatedProfile = businessProfile

      if (hasTextHeaderChanges) {
        const lat = Number(businessProfile?.businessLocation?.lat)
        const lng = Number(businessProfile?.businessLocation?.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          toast.error('Business location is missing. Please complete your profile first.')
          set({ isSavingHeader: false })
          return { ok: false }
        }

        const profileResponse = await updateMyBusinessProfile({
          ownerName: businessProfile?.ownerName || user?.name || 'Business Owner',
          businessName: businessNameInput.trim(),
          address: businessProfile?.address || 'Business address',
          phone: businessProfile?.contact_info?.phone || '0000000',
          about: businessDescriptionInput.trim(),
          website: businessProfile?.website || '',
          lat,
          lng
        })
        updatedProfile = profileResponse?.data?.data || updatedProfile
      }

      if (logoFileData) {
        const logoResponse = await uploadMyBusinessProfileImage(logoFileData)
        updatedProfile = logoResponse?.data?.data || updatedProfile
      }

      if (bannerFileData) {
        const bannerResponse = await uploadMyBusinessBannerImage(bannerFileData)
        updatedProfile = bannerResponse?.data?.data || updatedProfile
      }

      set({ businessProfile: updatedProfile || businessProfile })
      toast.success('Business header updated successfully.')
      return { ok: true, profile: updatedProfile || businessProfile }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update business header.')
      return { ok: false }
    } finally {
      set({ isSavingHeader: false })
    }
  }
}))
