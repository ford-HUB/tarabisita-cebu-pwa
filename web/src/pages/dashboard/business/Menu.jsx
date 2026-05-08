import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessItemList } from '../../../hooks/useBusinessItemList.hook'
import {
  ItemListFormSection,
  ItemListHeaderSection,
  ItemListSection
} from '../../../components/business/menu/sections'
import { getBusinessCategoryLabel } from '../../../shared/constants/businessCategories.constants'

const Menu = () => {
  const { user } = useAuth()
  const categoryLabel = getBusinessCategoryLabel(user?.businessCategory)
  const normalizedCategory = String(user?.businessCategory || '').trim().toUpperCase()
  const isAccommodationBusiness = normalizedCategory === 'RESORT' || normalizedCategory === 'HOTEL'
  const addLabel = categoryLabel === 'Restaurant' ? 'Menus' : isAccommodationBusiness ? 'Manage' : 'Products'

  const {
    form,
    menuItems,
    isAddingMenu,
    setIsAddingMenu,
    isImageLoading,
    isLoadingMenuItems,
    isSavingMenuItem,
    activeDeleteId,
    activeStockId,
    activeRestoreId,
    activeEditId,
    isEditModalOpen,
    selectedEditItem,
    deletedMenuItems,
    isDeletedModalOpen,
    setIsDeletedModalOpen,
    setField,
    handleImageSelection,
    handleRemoveImage,
    handleAddMenuItem,
    handleDeleteMenuItem,
    handleStockStatusChange,
    handleRestoreMenuItem,
    openEditModal,
    closeEditModal,
    handleEditMenuItem,
    menuCategoryPresets,
    menuFlavorPresets,
    pickMenuCategoryPreset,
    pickMenuFlavorPreset,
    handleCategoryFieldKeyDown,
    handleFlavorFieldKeyDown,
    isSaveMenuCategoryPresetOpen,
    pendingMenuCategoryPreset,
    confirmSaveMenuCategoryPreset,
    dismissSaveMenuCategoryPreset,
    deleteMenuCategoryPreset,
    isSaveMenuFlavorPresetOpen,
    pendingMenuFlavorPreset,
    confirmSaveMenuFlavorPreset,
    dismissSaveMenuFlavorPreset,
    deleteMenuFlavorPreset
  } = useBusinessItemList(user, { isAccommodationBusiness })

  return (
    <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm">
      <ItemListHeaderSection
        categoryLabel={categoryLabel}
        addLabel={addLabel}
          isAccommodationBusiness={isAccommodationBusiness}
        isAddingMenu={isAddingMenu}
        setIsAddingMenu={setIsAddingMenu}
        deletedCount={deletedMenuItems.length}
        setIsDeletedModalOpen={setIsDeletedModalOpen}
      />

      {isAddingMenu && (
        <ItemListFormSection
          form={form}
          categoryLabel={categoryLabel}
          isAccommodationBusiness={isAccommodationBusiness}
          isImageLoading={isImageLoading}
          isSavingMenuItem={isSavingMenuItem}
          setField={setField}
          handleImageSelection={handleImageSelection}
          handleRemoveImage={handleRemoveImage}
          handleAddMenuItem={handleAddMenuItem}
          menuCategoryPresets={menuCategoryPresets}
          menuFlavorPresets={menuFlavorPresets}
          pickMenuCategoryPreset={pickMenuCategoryPreset}
          pickMenuFlavorPreset={pickMenuFlavorPreset}
          handleCategoryFieldKeyDown={handleCategoryFieldKeyDown}
          handleFlavorFieldKeyDown={handleFlavorFieldKeyDown}
          isSaveMenuCategoryPresetOpen={isSaveMenuCategoryPresetOpen}
          pendingMenuCategoryPreset={pendingMenuCategoryPreset}
          confirmSaveMenuCategoryPreset={confirmSaveMenuCategoryPreset}
          dismissSaveMenuCategoryPreset={dismissSaveMenuCategoryPreset}
          deleteMenuCategoryPreset={deleteMenuCategoryPreset}
          isSaveMenuFlavorPresetOpen={isSaveMenuFlavorPresetOpen}
          pendingMenuFlavorPreset={pendingMenuFlavorPreset}
          confirmSaveMenuFlavorPreset={confirmSaveMenuFlavorPreset}
          dismissSaveMenuFlavorPreset={dismissSaveMenuFlavorPreset}
          deleteMenuFlavorPreset={deleteMenuFlavorPreset}
        />
      )}

      <ItemListSection
        menuItems={menuItems}
        isLoadingMenuItems={isLoadingMenuItems}
        addLabel={addLabel}
        isAccommodationBusiness={isAccommodationBusiness}
        activeDeleteId={activeDeleteId}
        activeStockId={activeStockId}
        handleDeleteMenuItem={handleDeleteMenuItem}
        handleStockStatusChange={handleStockStatusChange}
        categoryLabel={categoryLabel}
        deletedMenuItems={deletedMenuItems}
        isDeletedModalOpen={isDeletedModalOpen}
        setIsDeletedModalOpen={setIsDeletedModalOpen}
        activeRestoreId={activeRestoreId}
        handleRestoreMenuItem={handleRestoreMenuItem}
        activeEditId={activeEditId}
        isEditModalOpen={isEditModalOpen}
        selectedEditItem={selectedEditItem}
        openEditModal={openEditModal}
        closeEditModal={closeEditModal}
        handleEditMenuItem={handleEditMenuItem}
      />

    </div>
  )
}

export default Menu
