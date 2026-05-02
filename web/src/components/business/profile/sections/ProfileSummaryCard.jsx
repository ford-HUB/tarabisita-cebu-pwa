import { FiCamera } from 'react-icons/fi'
import { InfoTile } from '../ui'

const buildInitials = (name) => {
  if (!name) return 'BO'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const ProfileSummaryCard = ({ profile, isEditing, isUploadingPhoto, onProfileImageChange }) => {
  return (
    <article className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Business profile"
              className="h-16 w-16 rounded-2xl border border-[#efe6dc] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2e8da] text-xl font-semibold text-[#9b5a2c]">
              {buildInitials(profile.name)}
            </div>
          )}
          {isEditing && (
            <label
              className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e7dfd5] bg-white text-[#7d7164] shadow-sm transition hover:bg-[#f5eee4]"
              title="Upload or update profile picture"
            >
              <input type="file" accept="image/*" className="hidden" onChange={onProfileImageChange} />
              <FiCamera size={15} />
            </label>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f]">{profile.name}</h2>
          <p className="text-sm text-[#5b5b5b]">{profile.role} Account</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <InfoTile label="Business Name" value={profile.businessName} />
        <InfoTile label="Email" value={profile.email} />
        <InfoTile label="Phone" value={profile.phone} />
      </div>
      {isUploadingPhoto && <p className="mt-4 text-xs text-[#7d7164]">Uploading profile picture...</p>}
    </article>
  )
}

export default ProfileSummaryCard
