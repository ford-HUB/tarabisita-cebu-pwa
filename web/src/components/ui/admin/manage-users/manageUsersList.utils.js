/** Normalize GET /auth/admin/users response into list + pagination state. */
export const applyAdminUsersListResponse = (res, { setRows, setTotal, setTotalPages, setPage, currentPage }) => {
  const meta = res?.data
  const nextRows = meta?.data || []
  setRows(nextRows)
  setTotal(meta?.total ?? 0)
  setTotalPages(meta?.totalPages ?? 0)
  if (typeof meta?.page === 'number' && meta.page !== currentPage) {
    setPage(meta.page)
  }
}
