import { FiX } from 'react-icons/fi'
import { formatDate, getInitials } from './utils'

const ReviewModalHeader = ({ businessName, logo, submittedAt, onClose }) => (
  <div className="flex items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
    <div className="flex items-center gap-3">
      {logo ? (
        <img
          src={logo}
          alt={`${businessName} avatar`}
          className="h-10 w-10 rounded-full border border-[#e8ded2] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e8da] text-xs font-semibold text-[#9b5a2c]">
          {getInitials(businessName)}
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[#a79a8b]">Review Request</p>
        <h2 className="mt-1 text-xl font-semibold text-[#1f1f1f]">{businessName}</h2>
        <p className="mt-1 text-xs text-[#4f4f4f]">Submitted on {formatDate(submittedAt)}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f5eee4]"
      aria-label="Close review modal"
    >
      <FiX size={16} />
    </button>
  </div>
)

export default ReviewModalHeader
