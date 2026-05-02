import { useEffect, useState } from 'react'
import { getInitials } from '../request-approval/utils'

/**
 * User profile image or initials fallback (handles broken image URLs).
 */
const ManageUsersAvatar = ({ name, avatar, sizeClass = 'h-9 w-9', textClass = 'text-xs' }) => {
  const [imgBroken, setImgBroken] = useState(false)
  const src = avatar && String(avatar).trim()

  useEffect(() => {
    setImgBroken(false)
  }, [src])

  if (src && !imgBroken) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full border border-[#e8ded2] object-cover`}
        onError={() => setImgBroken(true)}
      />
    )
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-[#f2e8da] font-semibold text-[#9b5a2c] ${textClass}`}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  )
}

export default ManageUsersAvatar
