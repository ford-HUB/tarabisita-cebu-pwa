import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessInterface } from '../../../hooks/useBusinessInterface.hook'
import { InterfaceHeaderSection, InterfaceMenuSection } from '../../../components/business/interface/sections'
import { getBusinessCategoryLabel } from '../../../shared/constants/businessCategories.constants'

const Interface = () => {
  const { user } = useAuth()
  const categoryLabel = getBusinessCategoryLabel(user?.businessCategory)
  const businessLabel = `Your ${categoryLabel}`
  const {
    isResort,
    emptyCards,
    isEditingHeader,
    isSavingHeader,
    businessProfile,
    businessNameInput,
    setBusinessNameInput,
    businessDescriptionInput,
    setBusinessDescriptionInput,
    logoUrl,
    bannerUrl,
    bannerFileData,
    showCardDetails,
    setShowCardDetails,
    hasHeaderChanges,
    cardListClassName,
    handleLogoChange,
    handleBannerChange,
    handleHeaderAction,
    getCardClassName,
    menuItems,
    isLoadingMenuItems,
    menuCategories,
    resortSpotlightImage,
    resortGalleryImages,
    handleResortSpotlightChange,
    handleResortGalleryAdd,
    handleResortGalleryReplace
  } = useBusinessInterface({ user, categoryLabel })

  return (
    <div className="space-y-6 rounded-2xl bg-[#f6f2ed] p-4 md:p-5">
      <InterfaceHeaderSection
        businessLabel={businessLabel}
        categoryLabel={categoryLabel}
        bannerUrl={bannerUrl}
        isEditingHeader={isEditingHeader}
        bannerFileData={bannerFileData}
        handleBannerChange={handleBannerChange}
        logoUrl={logoUrl}
        handleLogoChange={handleLogoChange}
        businessNameInput={businessNameInput}
        businessNameFallback={businessProfile?.name}
        setBusinessNameInput={setBusinessNameInput}
        businessDescriptionInput={businessDescriptionInput}
        setBusinessDescriptionInput={setBusinessDescriptionInput}
        handleHeaderAction={handleHeaderAction}
        hasHeaderChanges={hasHeaderChanges}
        isSavingHeader={isSavingHeader}
      />

      <InterfaceMenuSection
        categoryLabel={categoryLabel}
        showCardDetails={showCardDetails}
        setShowCardDetails={setShowCardDetails}
        cardListClassName={cardListClassName}
        emptyCards={emptyCards}
        getCardClassName={getCardClassName}
        menuItems={menuItems}
        isLoadingMenuItems={isLoadingMenuItems}
        menuCategories={menuCategories}
        bannerUrl={bannerUrl}
        businessNameInput={businessNameInput}
        businessDescriptionInput={businessDescriptionInput}
        logoUrl={logoUrl}
        isResort={isResort}
        resortSpotlightImage={resortSpotlightImage}
        resortGalleryImages={resortGalleryImages}
        handleResortSpotlightChange={handleResortSpotlightChange}
        handleResortGalleryAdd={handleResortGalleryAdd}
        handleResortGalleryReplace={handleResortGalleryReplace}
      />
    </div>
  )
}

export default Interface
