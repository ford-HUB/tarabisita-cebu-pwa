import { useEffect, useState } from 'react'
import { FiMoreVertical } from 'react-icons/fi'
import { formatDate } from '../request-approval/utils'
import ManageUsersActionsModal from './ManageUsersActionsModal'
import ManageUsersAvatar from './ManageUsersAvatar'

const whitelistLabel = (on) => (on ? 'Whitelisted' : 'Not whitelisted')

const ManageUsersTableSection = ({
  isLoading,
  rows,
  currentUserId,
  whitelistBusyId,
  deleteBusyId,
  onToggleWhitelist,
  onDeleteUser
}) => {
  const [actionUserId, setActionUserId] = useState(null)
  const actionUser = actionUserId ? rows.find((r) => r.id === actionUserId) ?? null : null

  useEffect(() => {
    if (actionUserId && !rows.some((r) => r.id === actionUserId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when row no longer in filtered list
      setActionUserId(null)
    }
  }, [actionUserId, rows])

  if (isLoading) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[#6d645d] md:px-6">Loading users…</div>
    )
  }

  if (!rows.length) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[#6d645d] md:px-6">No users match the current filters.</div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#f0e7dd] bg-[#fcfaf7] text-xs font-semibold uppercase tracking-wide text-[#7d736a]">
              <th className="px-4 py-3 md:px-6">Account</th>
              <th className="px-4 py-3 md:px-6">Email</th>
              <th className="px-4 py-3 md:px-6">Role</th>
              <th className="px-4 py-3 md:px-6">Whitelist</th>
              <th className="px-4 py-3 md:px-6">Joined</th>
              <th className="px-4 py-3 text-right md:px-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#f5efe6] last:border-0">
                <td className="px-4 py-3 md:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <ManageUsersAvatar name={row.name} avatar={row.avatar} />
                    <span className="min-w-0 truncate font-medium text-[#1f1f1f]">{row.name || '—'}</span>
                  </div>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-[#2f2f2f] md:max-w-xs md:px-6" title={row.email}>
                  {row.email || '—'}
                </td>
                <td className="px-4 py-3 md:px-6">
                  <span className="rounded-lg bg-[#f2e8da] px-2 py-0.5 text-xs font-medium text-[#824b24]">
                    {row.role || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 md:px-6">
                  <span
                    className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                      row.whitelisted
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                        : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                    }`}
                  >
                    {whitelistLabel(row.whitelisted)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#5f5f5f] md:px-6">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-right md:px-6">
                  <button
                    type="button"
                    onClick={() => setActionUserId(row.id)}
                    className="inline-flex rounded-lg border border-[#e7dfd5] p-2 text-[#5f5f5f] transition hover:border-[#d4c4b0] hover:bg-[#f7f3ed] hover:text-[#2f2f2f]"
                    aria-label={`Actions for ${row.name || 'user'}`}
                  >
                    <FiMoreVertical size={18} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ManageUsersActionsModal
        key={actionUser?.id ?? 'closed'}
        user={actionUser}
        onClose={() => setActionUserId(null)}
        currentUserId={currentUserId}
        whitelistBusyId={whitelistBusyId}
        deleteBusyId={deleteBusyId}
        onToggleWhitelist={onToggleWhitelist}
        onDeleteUser={async (userId) => {
          await onDeleteUser(userId)
          setActionUserId((id) => (id === userId ? null : id))
        }}
      />
    </>
  )
}

export default ManageUsersTableSection
