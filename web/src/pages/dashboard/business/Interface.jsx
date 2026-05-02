import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessInterface } from '../../../hooks/useBusinessInterface.hook'
import { InterfaceHeaderSection, InterfaceMenuSection } from '../../../components/business/interface/sections'
import { getBusinessCategoryLabel } from '../../../shared/constants/businessCategories.constants'

const Interface = () => {
  const { user } = useAuth()
  const categoryLabel = getBusinessCategoryLabel(user?.businessCategory)
  const businessLabel = `Your ${categoryLabel}`
  const {
    emptyCards,
    themeColor,
    setThemeColor,
    isSavingThemeColor,
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
    savedCardLayout,
    cardLayoutDraft,
    setCardLayoutDraft,
    isEditingLayout,
    showCardDetails,
    setShowCardDetails,
    hasHeaderChanges,
    hasPendingLayoutChange,
    cardListClassName,
    handleSaveThemeColor,
    handleLogoChange,
    handleBannerChange,
    handleHeaderAction,
    getCardClassName,
    handleStartLayoutEdit,
    handleSaveLayout,
    handleCancelLayoutEdit
  } = useBusinessInterface({ user, categoryLabel })

  return (
    <div
      className="space-y-6 rounded-2xl p-4 md:p-5"
      style={{
        backgroundColor: `${themeColor}14`
      }}
    >
      <InterfaceHeaderSection
        businessLabel={businessLabel}
        categoryLabel={categoryLabel}
        themeColor={themeColor}
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
        handleSaveThemeColor={handleSaveThemeColor}
        isSavingThemeColor={isSavingThemeColor}
        setThemeColor={setThemeColor}
        handleHeaderAction={handleHeaderAction}
        hasHeaderChanges={hasHeaderChanges}
        isSavingHeader={isSavingHeader}
      />

      <InterfaceMenuSection
        themeColor={themeColor}
        categoryLabel={categoryLabel}
        isEditingLayout={isEditingLayout}
        hasPendingLayoutChange={hasPendingLayoutChange}
        handleStartLayoutEdit={handleStartLayoutEdit}
        handleSaveLayout={handleSaveLayout}
        handleCancelLayoutEdit={handleCancelLayoutEdit}
        savedCardLayout={savedCardLayout}
        cardLayoutDraft={cardLayoutDraft}
        setCardLayoutDraft={setCardLayoutDraft}
        showCardDetails={showCardDetails}
        setShowCardDetails={setShowCardDetails}
        cardListClassName={cardListClassName}
        emptyCards={emptyCards}
        getCardClassName={getCardClassName}
      />
    </div>
  )
}

export default Interface
