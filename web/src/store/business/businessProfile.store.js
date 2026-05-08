import { create } from 'zustand'
import { toast } from 'sonner'
import { DEFAULT_LOCATION, DEFAULT_PROFILE } from '../../shared/constants/profile.constants'
import {
  changeMyBusinessPassword,
  getMyBusinessActivityLogs,
  getMyBusinessProfile,
  submitMyBusinessProof,
  updateMyBusinessProfile,
  uploadMyBusinessAvatarImage
} from '../../services/business/business.service'

const defaultLocation = () => ({
  lat: Number(DEFAULT_LOCATION.lat),
  lng: Number(DEFAULT_LOCATION.lng)
})

const defaultInitialProfileValues = () => ({
  ownerName: DEFAULT_PROFILE.name,
  businessName: DEFAULT_PROFILE.businessName,
  address: DEFAULT_PROFILE.address,
  phone: DEFAULT_PROFILE.phone,
  about: DEFAULT_PROFILE.about,
  website: '',
  lat: Number(DEFAULT_LOCATION.lat),
  lng: Number(DEFAULT_LOCATION.lng)
})

const buildFormValues = (data, user) => ({
  ownerName: data?.ownerName || user?.name || DEFAULT_PROFILE.name,
  businessName: data?.name || DEFAULT_PROFILE.businessName,
  address: data?.address || DEFAULT_PROFILE.address,
  phone: data?.contact_info?.phone || DEFAULT_PROFILE.phone,
  about: data?.description || DEFAULT_PROFILE.about,
  website: data?.website || ''
})

const buildLocation = (data) => ({
  lat: Number(data?.businessLocation?.lat ?? DEFAULT_LOCATION.lat),
  lng: Number(data?.businessLocation?.lng ?? DEFAULT_LOCATION.lng)
})

export const useBusinessProfileStore = create((set, get) => ({
  profileData: null,
  isLoadingProfile: true,
  isEditing: false,
  isSaving: false,
  isUploadingPhoto: false,
  isConfirmPasswordModalOpen: false,
  isPasswordModalOpen: false,
  isChangingPassword: false,
  isProofModalOpen: false,
  isSubmittingProof: false,
  isSecurityModalOpen: false,
  isActivityPanelOpen: false,
  isLoadingActivityLogs: false,
  activityLogs: [],
  initialProfileValues: defaultInitialProfileValues(),
  location: defaultLocation(),

  setProfileData: (profileData) => set({ profileData }),
  setIsLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsUploadingPhoto: (isUploadingPhoto) => set({ isUploadingPhoto }),
  setIsConfirmPasswordModalOpen: (isConfirmPasswordModalOpen) => set({ isConfirmPasswordModalOpen }),
  setIsPasswordModalOpen: (isPasswordModalOpen) => set({ isPasswordModalOpen }),
  setIsChangingPassword: (isChangingPassword) => set({ isChangingPassword }),
  setIsProofModalOpen: (isProofModalOpen) => set({ isProofModalOpen }),
  setIsSubmittingProof: (isSubmittingProof) => set({ isSubmittingProof }),
  setIsSecurityModalOpen: (isSecurityModalOpen) => set({ isSecurityModalOpen }),
  setIsActivityPanelOpen: (isActivityPanelOpen) => set({ isActivityPanelOpen }),
  setIsLoadingActivityLogs: (isLoadingActivityLogs) => set({ isLoadingActivityLogs }),
  setActivityLogs: (activityLogs) => set({ activityLogs }),

  setInitialProfileValues: (initialProfileValues) => set({ initialProfileValues }),

  setLocation: (next) =>
    set((state) => ({
      location: typeof next === 'function' ? next(state.location) : next
    })),

  patchHydratedSnapshot: ({ initialProfileValues, location }) =>
    set({ initialProfileValues, location }),

  /** service → store: load profile; returns `{ formValues }` for hook `reset()`. */
  loadProfile: async (user) => {
    set({ isLoadingProfile: true })
    try {
      const response = await getMyBusinessProfile({ businessCategory: user?.businessCategory })
      const data = response?.data?.data
      const formValues = buildFormValues(data, user)
      const loc = buildLocation(data)
      set({
        profileData: data,
        isLoadingProfile: false,
        initialProfileValues: {
          ...formValues,
          lat: loc.lat,
          lng: loc.lng
        },
        location: loc
      })
      return { ok: true, formValues }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business profile.')
      set({ isLoadingProfile: false })
      return { ok: false }
    }
  },

  /** Re-apply current `profileData` to snapshot (cancel edit); returns `{ formValues }`. */
  reapplyBaselineFromStoredProfile: (user) => {
    const data = get().profileData
    const formValues = buildFormValues(data, user)
    const loc = buildLocation(data)
    set({
      initialProfileValues: {
        ...formValues,
        lat: loc.lat,
        lng: loc.lng
      },
      location: loc
    })
    return { formValues }
  },

  saveProfile: async ({ values, location, user, mergeUser }) => {
    set({ isSaving: true })
    try {
      const response = await updateMyBusinessProfile({
        ownerName: values.ownerName.trim(),
        businessName: values.businessName.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
        about: values.about.trim(),
        website: values.website?.trim() || '',
        lat: Number(location.lat),
        lng: Number(location.lng)
      })
      const updated = response?.data?.data
      const formValues = buildFormValues(updated, user)
      const loc = buildLocation(updated)
      set({
        profileData: updated,
        initialProfileValues: {
          ...formValues,
          lat: loc.lat,
          lng: loc.lng
        },
        location: loc,
        isEditing: false
      })
      if (mergeUser && updated?.ownerName) {
        mergeUser({ name: updated.ownerName })
      }
      toast.success('Business profile saved successfully.')
      return { ok: true, formValues }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save business profile.')
      return { ok: false }
    } finally {
      set({ isSaving: false })
    }
  },

  /** Pass `mergeUser` to sync auth avatar after upload. */
  uploadProfileAvatar: async ({ base64Image, mergeUser }) => {
    set({ isUploadingPhoto: true })
    try {
      const response = await uploadMyBusinessAvatarImage(base64Image)
      const updatedProfile = response?.data?.data
      set({ profileData: updatedProfile })
      if (mergeUser) {
        mergeUser({ avatar: updatedProfile?.avatar || '' })
      }
      toast.success('Profile image updated successfully.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload profile image.')
      return { ok: false }
    } finally {
      set({ isUploadingPhoto: false })
    }
  },

  changePassword: async (passwordForm) => {
    set({ isChangingPassword: true })
    try {
      await changeMyBusinessPassword(passwordForm)
      toast.success('Password changed successfully.')
      get().setIsConfirmPasswordModalOpen(false)
      get().setIsPasswordModalOpen(false)
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change password.')
      return { ok: false }
    } finally {
      set({ isChangingPassword: false })
    }
  },

  submitBusinessProof: async ({ proofs, proofDocuments, notes }) => {
    if (!proofs.length && !proofDocuments.length) {
      toast.error('Please provide at least one legal proof link or uploaded document.')
      return { ok: false }
    }
    set({ isSubmittingProof: true })
    try {
      const response = await submitMyBusinessProof({ proofs, proofDocuments, notes })
      const updated = response?.data?.data
      if (updated) set({ profileData: updated })
      toast.success('Business proof submitted successfully.')
      return { ok: true }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit business proof.')
      return { ok: false }
    } finally {
      set({ isSubmittingProof: false })
    }
  },

  loadActivityLogs: async () => {
    set({ isLoadingActivityLogs: true })
    try {
      const response = await getMyBusinessActivityLogs({ limit: 30 })
      set({ activityLogs: response?.data?.data || [] })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load activity logs.')
    } finally {
      set({ isLoadingActivityLogs: false })
    }
  }
}))
