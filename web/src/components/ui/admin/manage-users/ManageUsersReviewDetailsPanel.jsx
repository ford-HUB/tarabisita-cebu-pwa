import { FiAlertCircle, FiRefreshCw, FiShield, FiX } from 'react-icons/fi'
import { formatDate } from '../request-approval/utils'
import ManageUsersAvatar from './ManageUsersAvatar'
import { useAdminManageUsersStore } from '../../../../store/admin/manageUsers.store'

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

const Field = ({ label, value, mono }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9d8f80]">{label}</p>
    <p className={`mt-0.5 break-words text-sm text-[#2f2f2f] ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</p>
  </div>
)

const SectionCard = ({ title, children }) => (
  <section className="rounded-xl border border-[#efe7dc] bg-[#fcfaf7] p-4 shadow-sm">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#824b24]">{title}</h3>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
)

const ManageUsersReviewDetailsPanel = ({ userId, summaryUser, onClose }) => {
  const userDetails = useAdminManageUsersStore((s) => s.userDetails)
  const userDetailsLoading = useAdminManageUsersStore((s) => s.userDetailsLoading)
  const userDetailsError = useAdminManageUsersStore((s) => s.userDetailsError)
  const fetchUserDetails = useAdminManageUsersStore((s) => s.fetchUserDetails)

  const d = userDetails && String(userDetails.id) === String(userId) ? userDetails : null
  const displayName = d?.name ?? summaryUser?.name ?? '—'
  const displayAvatar = d?.avatar ?? summaryUser?.avatar ?? null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-users-review-details-title"
      className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#ece3d9] bg-white shadow-xl max-lg:max-h-[min(70vh,520px)] lg:max-h-[min(92vh,calc(100vh-24px))]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ManageUsersAvatar name={displayName} avatar={displayAvatar} sizeClass="h-11 w-11" textClass="text-sm" />
          <div className="min-w-0">
            <h2 id="manage-users-review-details-title" className="text-base font-semibold text-[#1f1f1f]">
              Review details
            </h2>
            <p className="mt-1 truncate text-sm font-medium text-[#9b5a2c]">{displayName}</p>
            <p className="truncate text-xs text-[#6d645d]">{d?.email || summaryUser?.email || 'No email'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
          aria-label="Close review details"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {userDetailsLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-[#6d645d]">
            <span
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#e7dfd5] border-t-[#9b5a2c]"
              aria-hidden
            />
            <span>Loading user information…</span>
          </div>
        ) : userDetailsError ? (
          <div className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4">
            <div className="flex gap-2 text-sm text-amber-950">
              <FiAlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden />
              <p>{userDetailsError}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUserDetails(userId)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-4 py-2.5 text-sm font-medium text-[#9b5a2c] transition hover:bg-[#f7f3ed]"
            >
              <FiRefreshCw size={16} aria-hidden />
              Try again
            </button>
          </div>
        ) : d ? (
          <div className="space-y-4">
            <SectionCard title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary email" value={d.email || '—'} />
                <Field label="Support email" value={d.supportEmail || '—'} />
                <Field label="Email verified" value={d.isEmailVerified ? 'Yes' : 'No'} />
                <Field label="Verified at" value={formatDateTime(d.emailVerifiedAt)} />
              </div>
            </SectionCard>

            <SectionCard title="Account">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role" value={d.role || '—'} />
                <Field label="Whitelist" value={d.whitelisted ? 'Whitelisted' : 'Not whitelisted'} />
                <Field label="Joined" value={formatDate(d.createdAt)} />
                <Field label="Last updated" value={formatDateTime(d.updatedAt)} />
                <Field
                  label="Total orders / bookings"
                  value={String(d.totalOrdersBookings ?? 0)}
                />
                <Field label="Review count" value={String(d.reviewCount ?? 0)} />
                <div className="sm:col-span-2">
                  <Field label="User ID" value={d.id} mono />
                </div>
              </div>
            </SectionCard>

            <div className="flex items-start gap-2 rounded-xl border border-[#e1d4c5] bg-[#f7f3ed]/60 px-3 py-3 text-xs text-[#5a534c]">
              <FiShield className="mt-0.5 shrink-0 text-[#9b5a2c]" size={16} aria-hidden />
              <p>
                Passwords and authentication secrets are never shown. This view is available to administrators only.
              </p>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#6d645d]">No data loaded.</p>
        )}
      </div>
    </div>
  )
}

export default ManageUsersReviewDetailsPanel
