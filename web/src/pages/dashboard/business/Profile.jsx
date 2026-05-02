import { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessMap } from '../../../hooks/useBusinessMap.hook'
import { useBusinessProfile } from '../../../hooks/useBusinessProfile.hook'
import {
  BusinessProofModal,
  ChangePasswordConfirmModal,
  ChangePasswordFormModal,
  SecurityActivityModal
} from '../../../components/business/profile/modals'
import { StatCard } from '../../../components/business/profile/ui'
import {
  BusinessInformationSection,
  BusinessLocationSection,
  ProfileSummaryCard
} from '../../../components/business/profile/sections'

const Profile = () => {
  const { user, setUser } = useAuth()
  const locationState = useLocation()
  const {
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
  } = useBusinessProfile({ user, setUser })

  useEffect(() => {
    const searchParams = new URLSearchParams(locationState.search)
    if (searchParams.get('view') !== 'activity') return
    handleOpenSecurityActivityLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationState.search])

  const isBusinessVerified = useMemo(() => {
    const verificationStatus =
      profileData?.verificationStatus ||
      user?.businessVerificationStatus ||
      user?.verificationStatus ||
      user?.business?.verificationStatus ||
      'PENDING'

    return String(verificationStatus).trim().toUpperCase() === 'VERIFIED'
  }, [profileData, user])

  const profileStats = useMemo(() => {
    const verificationStatus =
      profileData?.verificationStatus ||
      user?.businessVerificationStatus ||
      user?.verificationStatus ||
      user?.business?.verificationStatus ||
      'PENDING'

    const normalizedVerificationStatus = String(verificationStatus).trim().toUpperCase()
    const isVerified = isBusinessVerified
    const isRejected = normalizedVerificationStatus === 'REJECTED'

    const verificationValue = isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending'
    const verificationHelper = isVerified
      ? 'Your business account is fully verified.'
      : isRejected
        ? 'Your proof submission was rejected. Please review and resubmit.'
        : 'Our team will review after proof submission.'

    const joinedDate = profileData?.createdAt || user?.createdAt
    const memberSince = joinedDate ? new Date(joinedDate).getFullYear() : '2026'

    return [
      {
        label: 'Profile completion',
        value: isVerified ? '100%' : '78%',
        helper: isVerified
          ? 'Business profile and verification requirements are complete.'
          : 'Add business permit and logo to complete.'
      },
      { label: 'Verification status', value: verificationValue, helper: verificationHelper },
      { label: 'Member since', value: String(memberSince), helper: 'Partnered with Tara Bisita Cebu.' }
    ]
  }, [isBusinessVerified, profileData, user])

  const handleAddressResolved = useCallback((address) => {
    handleFieldChange('address', address)
  }, [handleFieldChange])

  const {
    mapboxToken,
    mapContainerRef,
    mapboxPreviewUrl,
    isLocating,
    locationError,
    clearLocationError,
    handleLocationChange,
    handleUseCurrentLocation,
    handleOpenMapbox
  } = useBusinessMap({
    isEditing,
    location,
    setLocation,
    onAddressResolved: handleAddressResolved
  })

  const handleToggleEdit = () => {
    if (isEditing) clearLocationError()
    handleEditToggle()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#1f1f1f]">User Profile</h1>

      <section className="grid gap-4 md:grid-cols-3">
        {profileStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
        <ProfileSummaryCard
          profile={profile}
          isEditing={isEditing}
          isUploadingPhoto={isUploadingPhoto}
          onProfileImageChange={handleProfileImageChange}
        />

        <BusinessInformationSection
          isEditing={isEditing}
          register={register}
          errors={errors}
          profile={profile}
          hasProfileChanges={hasProfileChanges}
          isSaving={isSaving}
          isBusinessVerified={isBusinessVerified}
          onSubmitProfile={handleSaveProfile}
          onStartEdit={handleToggleEdit}
          onCancelEdit={handleToggleEdit}
          onOpenChangePasswordFlow={handleOpenChangePasswordFlow}
          onOpenSecurityModal={handleOpenSecurityModal}
          onOpenProofModal={handleOpenProofModal}
        />
      </section>

      <BusinessLocationSection
        isEditing={isEditing}
        mapboxToken={mapboxToken}
        mapContainerRef={mapContainerRef}
        mapboxPreviewUrl={mapboxPreviewUrl}
        isLocating={isLocating}
        locationError={locationError}
        location={location}
        onUseCurrentLocation={handleUseCurrentLocation}
        onOpenMapbox={handleOpenMapbox}
        onLocationChange={handleLocationChange}
      />
      {isLoadingProfile && (
        <p className="text-sm text-[#5b5b5b]">Loading business profile...</p>
      )}

      <ChangePasswordConfirmModal
        isOpen={isConfirmPasswordModalOpen}
        onClose={handleClosePasswordModals}
        onProceed={handleProceedToChangePassword}
      />

      <ChangePasswordFormModal
        isOpen={isPasswordModalOpen}
        isChangingPassword={isChangingPassword}
        onClose={handleClosePasswordModals}
        onSubmitPassword={handleSubmitPasswordChange}
      />

      <BusinessProofModal
        isOpen={isProofModalOpen}
        isSubmittingProof={isSubmittingProof}
        onClose={handleCloseProofModal}
        onSubmitProof={handleSubmitBusinessProof}
      />

      <SecurityActivityModal
        isOpen={isSecurityModalOpen}
        isActivityPanelOpen={isActivityPanelOpen}
        isLoadingActivityLogs={isLoadingActivityLogs}
        activityLogs={activityLogs}
        onClose={handleCloseSecurityModal}
        onToggleActivityPanel={handleToggleActivityPanel}
      />
    </div>
  )
}

export default Profile
