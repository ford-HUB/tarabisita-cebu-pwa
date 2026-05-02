import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { DEFAULT_LOCATION, DEFAULT_PROFILE } from '../shared/constants/profile.constants'
import { businessProfileSchema } from '../shared/validators/profile.validator'
import {
  changeMyBusinessPassword,
  getMyBusinessActivityLogs,
  getMyBusinessProfile,
  submitMyBusinessProof,
  updateMyBusinessProfile,
  uploadMyBusinessAvatarImage
} from '../services/business/business.service'

export const useBusinessProfile = ({ user, setUser }) => {
  const [profileData, setProfileData] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isConfirmPasswordModalOpen, setIsConfirmPasswordModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [isSubmittingProof, setIsSubmittingProof] = useState(false)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false)
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false)
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [initialProfileValues, setInitialProfileValues] = useState({
    ownerName: DEFAULT_PROFILE.name,
    businessName: DEFAULT_PROFILE.businessName,
    address: DEFAULT_PROFILE.address,
    phone: DEFAULT_PROFILE.phone,
    about: DEFAULT_PROFILE.about,
    website: '',
    lat: Number(DEFAULT_LOCATION.lat),
    lng: Number(DEFAULT_LOCATION.lng)
  })
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
  const [location, setLocation] = useState(() => ({
    lat: Number(DEFAULT_LOCATION.lat),
    lng: Number(DEFAULT_LOCATION.lng)
  }))

  const hydrateForm = (data) => {
    const nextValues = {
      ownerName: data?.ownerName || user?.name || DEFAULT_PROFILE.name,
      businessName: data?.name || DEFAULT_PROFILE.businessName,
      address: data?.address || DEFAULT_PROFILE.address,
      phone: data?.contact_info?.phone || DEFAULT_PROFILE.phone,
      about: data?.description || DEFAULT_PROFILE.about,
      website: data?.website || ''
    }
    reset(nextValues)

    const nextLocation = {
      lat: Number(data?.businessLocation?.lat ?? DEFAULT_LOCATION.lat),
      lng: Number(data?.businessLocation?.lng ?? DEFAULT_LOCATION.lng)
    }
    setLocation(nextLocation)
    setInitialProfileValues({
      ...nextValues,
      lat: nextLocation.lat,
      lng: nextLocation.lng
    })
  }

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const response = await getMyBusinessProfile()
      const data = response?.data?.data
      setProfileData(data)
      hydrateForm(data)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load business profile.')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      setIsUploadingPhoto(true)
      const base64Image = await fileToDataUrl(file)
      const response = await uploadMyBusinessAvatarImage(base64Image)
      const updatedProfile = response?.data?.data
      setProfileData(updatedProfile)
      setUser({ avatar: updatedProfile?.avatar || '' })
      toast.success('Profile image updated successfully.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload profile image.')
    } finally {
      setIsUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleSaveProfile = handleSubmit(async (values) => {
    try {
      setIsSaving(true)
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
      setProfileData(updated)
      hydrateForm(updated)
      setUser({ name: updated.ownerName })
      setIsEditing(false)
      toast.success('Business profile saved successfully.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save business profile.')
    } finally {
      setIsSaving(false)
    }
  })

  const handleEditToggle = () => {
    if (isEditing) {
      hydrateForm(profileData)
      setIsEditing(false)
      return
    }
    setIsEditing(true)
  }

  const handleOpenChangePasswordFlow = () => setIsConfirmPasswordModalOpen(true)
  const handleProceedToChangePassword = () => {
    setIsConfirmPasswordModalOpen(false)
    setIsPasswordModalOpen(true)
  }
  const handleClosePasswordModals = () => {
    setIsConfirmPasswordModalOpen(false)
    setIsPasswordModalOpen(false)
  }
  const handleSubmitPasswordChange = async (passwordForm) => {
    try {
      setIsChangingPassword(true)
      await changeMyBusinessPassword(passwordForm)
      toast.success('Password changed successfully.')
      handleClosePasswordModals()
      return true
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change password.')
      return false
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleOpenProofModal = () => setIsProofModalOpen(true)
  const handleCloseProofModal = () => setIsProofModalOpen(false)
  const handleSubmitBusinessProof = async ({ proofs, proofDocuments, notes }) => {
    try {
      if (!proofs.length && !proofDocuments.length) {
        toast.error('Please provide at least one legal proof link or uploaded document.')
        return false
      }
      setIsSubmittingProof(true)
      const response = await submitMyBusinessProof({ proofs, proofDocuments, notes })
      const updated = response?.data?.data
      if (updated) setProfileData(updated)
      toast.success('Business proof submitted successfully.')
      return true
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit business proof.')
      return false
    } finally {
      setIsSubmittingProof(false)
    }
  }

  const loadActivityLogs = async () => {
    try {
      setIsLoadingActivityLogs(true)
      const response = await getMyBusinessActivityLogs({ limit: 30 })
      setActivityLogs(response?.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load activity logs.')
    } finally {
      setIsLoadingActivityLogs(false)
    }
  }

  const handleOpenSecurityModal = async () => {
    setIsSecurityModalOpen(true)
    await loadActivityLogs()
  }

  const handleOpenSecurityActivityLogs = async () => {
    setIsSecurityModalOpen(true)
    setIsActivityPanelOpen(true)
    await loadActivityLogs()
  }

  const handleCloseSecurityModal = () => {
    setIsSecurityModalOpen(false)
    setIsActivityPanelOpen(false)
  }

  const handleToggleActivityPanel = async () => {
    if (!isActivityPanelOpen && !activityLogs.length) {
      await loadActivityLogs()
    }
    setIsActivityPanelOpen((current) => !current)
  }

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
