import { getAdminProfileByUserId, updateAdminProfileByUserId } from './admin-account.service.js'

const mapUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.roleId?.name
})

export const getMyAdminProfile = async (req, res) => {
  try {
    const user = await getAdminProfileByUserId(req.user._id)
    return res.status(200).json({
      message: 'Profile loaded',
      user: mapUserResponse(user)
    })
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' })
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Not allowed' })
    }
    return res.status(500).json({ message: error.message })
  }
}

export const patchMyAdminProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.validatedData.body
    const user = await updateAdminProfileByUserId(req.user._id, {
      name,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined
    })
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: mapUserResponse(user)
    })
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' })
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Not allowed' })
    }
    if (error.message === 'INVALID_NAME') {
      return res.status(400).json({ message: 'Name is required' })
    }
    if (error.message === 'CURRENT_PASSWORD_REQUIRED') {
      return res.status(400).json({ message: 'Current password is required to change your password' })
    }
    if (error.message === 'INVALID_CURRENT_PASSWORD') {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    if (error.message === 'NEW_PASSWORD_SAME_AS_CURRENT') {
      return res.status(400).json({ message: 'New password must be different from current password' })
    }
    if (error.message === 'NO_UPDATES') {
      return res.status(400).json({ message: 'No changes to save' })
    }
    return res.status(500).json({ message: error.message })
  }
}
