import bcrypt from 'bcrypt'
import User from '../../auth/models/user.model.js'

export const getAdminProfileByUserId = async (userId) => {
  const user = await User.findById(userId).populate('roleId', 'name').select('-password')
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }
  if (user.roleId?.name !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }
  return user
}

export const updateAdminProfileByUserId = async (userId, { name, currentPassword, newPassword }) => {
  const user = await User.findById(userId).populate('roleId', 'name')
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }
  if (user.roleId?.name !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }

  const updates = { updatedAt: new Date() }

  if (name !== undefined) {
    const trimmed = String(name).trim()
    if (!trimmed) {
      throw new Error('INVALID_NAME')
    }
    updates.name = trimmed
  }

  if (newPassword) {
    if (!currentPassword) {
      throw new Error('CURRENT_PASSWORD_REQUIRED')
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('INVALID_CURRENT_PASSWORD')
    }
    const samePassword = await bcrypt.compare(newPassword, user.password)
    if (samePassword) {
      throw new Error('NEW_PASSWORD_SAME_AS_CURRENT')
    }
    const genSalt = await bcrypt.genSalt(10)
    updates.password = await bcrypt.hash(newPassword, genSalt)
  }

  if (Object.keys(updates).length <= 1) {
    throw new Error('NO_UPDATES')
  }

  const updated = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
    .populate('roleId', 'name')
    .select('-password')

  return updated
}
