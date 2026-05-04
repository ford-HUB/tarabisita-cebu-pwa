import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { DEFAULT_PROFILE } from '../shared/constants/profile.constants'
import { businessProfileSchema } from '../shared/validators/profile.validator'
import { useBusinessProfileStore } from '../store/business/businessProfile.store'

export const useBusinessProfile = ({ user, setUser }) => {
  const {
    profileData,
    isLoadingProfile,
    isEditing,
    isSaving,
    isUploadingPhoto,
    isConfirmPasswordModalOpen,
    isPasswordModalOpen,
    isChangingPassword,
    isProofModalOpen,
    isSubmittingProof,
    isSecurityModalOpen,
    isActivityPanelOpen,
    isLoadingActivityLogs,
    activityLogs,
    initialProfileValues,
    location
  } = useBusinessProfileStore(
    useShallow((s) => ({
      profileData: s.profileData,
      isLoadingProfile: s.isLoadingProfile,
      isEditing: s.isEditing,
      isSaving: s.isSaving,
      isUploadingPhoto: s.isUploadingPhoto,
      isConfirmPasswordModalOpen: s.isConfirmPasswordModalOpen,
      isPasswordModalOpen: s.isPasswordModalOpen,
      isChangingPassword: s.isChangingPassword,
      isProofModalOpen: s.isProofModalOpen,
      isSubmittingProof: s.isSubmittingProof,
      isSecurityModalOpen: s.isSecurityModalOpen,
      isActivityPanelOpen: s.isActivityPanelOpen,
      isLoadingActivityLogs: s.isLoadingActivityLogs,
      activityLogs: s.activityLogs,
      initialProfileValues: s.initialProfileValues,
      location: s.location
    }))
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      ownerName: '',
      businessName: '',
      address: '',
      phone: '',
      about: '',
      website: ''
    }
  })
  const form = watch()

  useEffect(() => {
    const run = async () => {
      const result = await useBusinessProfileStore.getState().loadProfile(user)
      if (result?.ok && result.formValues) {
        reset(result.formValues)
      }
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const status = profileData?.verificationStatus
    if (typeof status !== 'string' || !setUser) return
    if (user?.businessVerificationStatus === status) return
    setUser({ businessVerificationStatus: status })
  }, [profileData?.verificationStatus, setUser, user?.businessVerificationStatus])

  const profile = useMemo(
    () => ({
      name: form.ownerName || DEFAULT_PROFILE.name,
      email: profileData?.ownerEmail || user?.email || DEFAULT_PROFILE.email,
      phone: form.phone || DEFAULT_PROFILE.phone,
      role: user?.role || DEFAULT_PROFILE.role,
      businessName: form.businessName || DEFAULT_PROFILE.businessName,
      address: form.address || DEFAULT_PROFILE.address,
      about: form.about || DEFAULT_PROFILE.about,
      avatar: profileData?.avatar || user?.avatar || ''
    }),
    [form, profileData?.ownerEmail, profileData?.avatar, user?.email, user?.role, user?.avatar]
  )

  const hasProfileChanges = useMemo(
    () =>
      isDirty ||
      Number(location.lat) !== Number(initialProfileValues.lat) ||
      Number(location.lng) !== Number(initialProfileValues.lng),
    [isDirty, location, initialProfileValues]
  )

  const handleFieldChange = (key, value) => {
    setValue(key, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: isEditing
    })
  }

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read selected image'))
      reader.readAsDataURL(file)
    })

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isEditing) {
      toast.error('Click Edit Profile first to change profile image.')
      return
    }

    try {
      const base64Image = await fileToDataUrl(file)
      await useBusinessProfileStore.getState().uploadProfileAvatar({
        base64Image,
        mergeUser: setUser
      })
    } finally {
      event.target.value = ''
    }
  }

  const handleSaveProfile = handleSubmit(async (values) => {
    const result = await useBusinessProfileStore.getState().saveProfile({
      values,
      location: useBusinessProfileStore.getState().location,
      user,
      mergeUser: setUser
    })
    if (result?.ok && result.formValues) {
      reset(result.formValues)
    }
  })

  const handleEditToggle = () => {
    const store = useBusinessProfileStore.getState()
    if (isEditing) {
      const r = store.reapplyBaselineFromStoredProfile(user)
      if (r?.formValues) reset(r.formValues)
      store.setIsEditing(false)
      return
    }
    store.setIsEditing(true)
  }

  const handleOpenChangePasswordFlow = () =>
    useBusinessProfileStore.getState().setIsConfirmPasswordModalOpen(true)

  const handleProceedToChangePassword = () => {
    const store = useBusinessProfileStore.getState()
    store.setIsConfirmPasswordModalOpen(false)
    store.setIsPasswordModalOpen(true)
  }

  const handleClosePasswordModals = () => {
    const store = useBusinessProfileStore.getState()
    store.setIsConfirmPasswordModalOpen(false)
    store.setIsPasswordModalOpen(false)
  }

  const handleSubmitPasswordChange = async (passwordForm) => {
    const result = await useBusinessProfileStore.getState().changePassword(passwordForm)
    return Boolean(result?.ok)
  }

  const handleOpenProofModal = () => useBusinessProfileStore.getState().setIsProofModalOpen(true)

  const handleCloseProofModal = () => useBusinessProfileStore.getState().setIsProofModalOpen(false)

  const handleSubmitBusinessProof = async ({ proofs, proofDocuments, notes }) => {
    const result = await useBusinessProfileStore
      .getState()
      .submitBusinessProof({ proofs, proofDocuments, notes })
    return Boolean(result?.ok)
  }

  const loadActivityLogs = async () => {
    await useBusinessProfileStore.getState().loadActivityLogs()
  }

  const handleOpenSecurityModal = async () => {
    useBusinessProfileStore.getState().setIsSecurityModalOpen(true)
    await loadActivityLogs()
  }

  const handleOpenSecurityActivityLogs = async () => {
    const store = useBusinessProfileStore.getState()
    store.setIsSecurityModalOpen(true)
    store.setIsActivityPanelOpen(true)
    await loadActivityLogs()
  }

  const handleCloseSecurityModal = () => {
    const store = useBusinessProfileStore.getState()
    store.setIsSecurityModalOpen(false)
    store.setIsActivityPanelOpen(false)
  }

  const handleToggleActivityPanel = async () => {
    const store = useBusinessProfileStore.getState()
    if (!store.isActivityPanelOpen && !store.activityLogs.length) {
      await loadActivityLogs()
    }
    store.setIsActivityPanelOpen(!store.isActivityPanelOpen)
  }

  const setLocation = (next) => useBusinessProfileStore.getState().setLocation(next)

  return {
    form,
    profile,
    profileData,
    location,
    register,
    errors,
    isEditing,
    isLoadingProfile,
    isSaving,
    isUploadingPhoto,
    isConfirmPasswordModalOpen,
    isPasswordModalOpen,
    isChangingPassword,
    isProofModalOpen,
    isSubmittingProof,
    isSecurityModalOpen,
    isActivityPanelOpen,
    isLoadingActivityLogs,
    activityLogs,
    hasProfileChanges,
    setLocation,
    handleFieldChange,
    handleProfileImageChange,
    handleSaveProfile,
    handleEditToggle,
    handleOpenChangePasswordFlow,
    handleProceedToChangePassword,
    handleClosePasswordModals,
    handleSubmitPasswordChange,
    handleOpenProofModal,
    handleCloseProofModal,
    handleSubmitBusinessProof,
    handleOpenSecurityModal,
    handleOpenSecurityActivityLogs,
    handleCloseSecurityModal,
    handleToggleActivityPanel
  }
}
