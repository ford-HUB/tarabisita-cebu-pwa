import { ManageUsersPageHeadingSection, ManageUsersPanelSection } from '../../../components/ui/admin/manage-users/sections'
import { useAdminManageUsers } from '../../../hooks/useAdminManageUsers.hook'

const ManageUsers = () => {
  const {
    register,
    errors,
    rows,
    isLoading,
    page,
    limit,
    total,
    totalPages,
    onPrevPage,
    onNextPage,
    currentUserId,
    whitelistBusyId,
    deleteBusyId,
    toggleWhitelist,
    removeUser
  } = useAdminManageUsers()

  return (
    <div className="w-full space-y-5">
      <ManageUsersPageHeadingSection />

      <ManageUsersPanelSection
        register={register}
        errors={errors}
        isLoading={isLoading}
        rows={rows}
        currentUserId={currentUserId}
        whitelistBusyId={whitelistBusyId}
        deleteBusyId={deleteBusyId}
        onToggleWhitelist={toggleWhitelist}
        onDeleteUser={removeUser}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    </div>
  )
}

export default ManageUsers
