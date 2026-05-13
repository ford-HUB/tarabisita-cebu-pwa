import { useEffect, useState } from 'react'
import { FiMail, FiTrash2, FiX } from 'react-icons/fi'
import { formatDate } from '../request-approval/utils'
import ManageUsersWhitelistToggle from './ManageUsersWhitelistToggle'
import ManageUsersComposeEmailModal from './ManageUsersComposeEmailModal'
import ManageUsersAvatar from './ManageUsersAvatar'

const ManageUsersActionsModal = ({
  user,
  onClose,
  currentUserId,
  whitelistBusyId,
  deleteBusyId,
  onToggleWhitelist,
  onDeleteUser
}) => {
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  useEffect(() => {
    if (!user) setIsComposeOpen(false)
  }, [user?.id])

  useEffect(() => {
    if (!user) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (isComposeOpen) setIsComposeOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user, onClose, isComposeOpen])

  if (!user) return null

  const isSelf = currentUserId && user.id === currentUserId
  const isAdminRole = user.role === 'ADMIN'
  const whitelistDisabled = isSelf
  const deleteDisabled = isSelf || isAdminRole

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsComposeOpen(false)
          onClose()
        }
      }}
    >
      <div
        className="flex max-h-[min(92vh,calc(100vh-24px))] w-full max-w-5xl flex-col items-stretch justify-center gap-4 overflow-y-auto lg:flex-row lg:items-start lg:justify-center"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-users-actions-title"
          className="w-full max-w-md shrink-0 rounded-2xl border border-[#ece3d9] bg-white shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <ManageUsersAvatar name={user.name} avatar={user.avatar} sizeClass="h-11 w-11" textClass="text-sm" />
              <div className="min-w-0">
                <h2 id="manage-users-actions-title" className="text-base font-semibold text-[#1f1f1f]">
                  User actions
                </h2>
                <p className="mt-1 truncate text-sm font-medium text-[#9b5a2c]">{user.name || '—'}</p>
                <p className="truncate text-xs text-[#6d645d]">{user.email || 'No email'}</p>
                {user.supportEmail ? (
                  <p className="mt-0.5 truncate text-xs text-[#6d645d]" title={user.supportEmail}>
                    Support email: <span className="font-medium text-[#5a534c]">{user.supportEmail}</span>
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsComposeOpen(false)
                onClose()
              }}
              className="shrink-0 rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="space-y-5 px-5 py-4">
            <div className="flex flex-wrap gap-2 text-xs text-[#6d645d]">
              <span className="rounded-lg bg-[#f2e8da] px-2 py-0.5 font-medium text-[#824b24]">{user.role || '—'}</span>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#efe7dc] bg-[#fcfaf7] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2f2f2f]">Whitelisted</p>
                <p className="mt-0.5 text-xs text-[#6d645d]">
                  {whitelistDisabled ? 'You cannot change your own status.' : 'Allow sign-in for this account.'}
                </p>
              </div>
              <ManageUsersWhitelistToggle
                id={`whitelist-modal-${user.id}`}
                checked={user.whitelisted}
                disabled={whitelistDisabled}
                busy={whitelistBusyId === user.id}
                onChange={(next) => onToggleWhitelist(user.id, next)}
              />
            </div>

            {user.email ? (
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-4 py-3 text-sm font-medium text-[#9b5a2c] transition hover:bg-[#f7f3ed]"
              >
                <FiMail size={16} aria-hidden />
                Compose email
              </button>
            ) : null}

            <button
              type="button"
              disabled={deleteDisabled || deleteBusyId === user.id}
              onClick={() => onDeleteUser(user.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                isSelf
                  ? 'You cannot delete your own account'
                  : isAdminRole
                    ? 'Admin accounts cannot be deleted'
                    : 'Delete this user'
              }
            >
              <FiTrash2 size={16} aria-hidden />
              {deleteBusyId === user.id ? 'Deleting…' : 'Delete user'}
            </button>
          </div>

          <div className="border-t border-[#f0e7dd] px-5 py-3">
            <button
              type="button"
              onClick={() => {
                setIsComposeOpen(false)
                onClose()
              }}
              className="w-full rounded-xl border border-[#e1d4c5] py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
            >
              Close
            </button>
          </div>
        </div>

        {isComposeOpen && user.email ? (
          <ManageUsersComposeEmailModal user={user} onClose={() => setIsComposeOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}

export default ManageUsersActionsModal
