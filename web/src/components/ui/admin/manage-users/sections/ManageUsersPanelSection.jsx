import ManageUsersToolbarSection from '../ManageUsersToolbarSection'
import ManageUsersTableSection from '../ManageUsersTableSection'
import ManageUsersPaginationSection from '../ManageUsersPaginationSection'

const ManageUsersPanelSection = ({
  register,
  errors,
  isLoading,
  rows,
  currentUserId,
  whitelistBusyId,
  deleteBusyId,
  onToggleWhitelist,
  onDeleteUser,
  page,
  limit,
  total,
  totalPages,
  onPrevPage,
  onNextPage
}) => (
  <section className="w-full overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
    <ManageUsersToolbarSection register={register} errors={errors} />
    <ManageUsersTableSection
      isLoading={isLoading}
      rows={rows}
      currentUserId={currentUserId}
      whitelistBusyId={whitelistBusyId}
      deleteBusyId={deleteBusyId}
      onToggleWhitelist={onToggleWhitelist}
      onDeleteUser={onDeleteUser}
    />
    <ManageUsersPaginationSection
      isLoading={isLoading}
      page={page}
      limit={limit}
      total={total}
      totalPages={totalPages}
      onPrev={onPrevPage}
      onNext={onNextPage}
    />
  </section>
)

export default ManageUsersPanelSection
