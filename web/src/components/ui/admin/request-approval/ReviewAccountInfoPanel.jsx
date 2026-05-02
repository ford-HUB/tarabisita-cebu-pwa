import { statusLabel } from './constants'
import InfoRow from './InfoRow'
import { formatDate } from './utils'

const ReviewAccountInfoPanel = ({ request }) => (
  <article className="space-y-3 rounded-2xl border border-[#ece3d9] bg-[#fffdfa] p-4">
    <h3 className="text-base font-semibold text-[#1f1f1f]">Account Information</h3>
    <div className="grid gap-3 md:grid-cols-2">
      <InfoRow label="Business Name" value={request.businessName} />
      <InfoRow label="Business ID" value={request.id} />
    </div>

    <div className="rounded-xl border border-[#e9dfd4] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9b5a2c]">Owner Identity</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <InfoRow label="Owner Name" value={request.ownerName} />
        <InfoRow label="Category" value={request.category} />
      </div>
    </div>

    <div className="rounded-xl border border-[#e9dfd4] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9b5a2c]">Contact Details</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <InfoRow label="Email" value={request.ownerEmail} />
        <InfoRow label="Phone" value={request.phone} />
      </div>
      <div className="mt-3">
        <InfoRow label="Address" value={request.address} />
      </div>
    </div>

    <div className="rounded-xl border border-[#e9dfd4] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9b5a2c]">Verification Snapshot</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <InfoRow label="Current Status" value={statusLabel[request.status] || request.status} />
        <InfoRow label="Submitted Date" value={formatDate(request.submittedAt)} />
      </div>
      {!!request.verificationNotes && request.verificationNotes !== '-' && (
        <div className="mt-3">
          <InfoRow label="Submitted Notes" value={request.verificationNotes} />
        </div>
      )}
    </div>
  </article>
)

export default ReviewAccountInfoPanel
