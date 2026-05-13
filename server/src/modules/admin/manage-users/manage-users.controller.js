import mongoose from 'mongoose'
import User from '../../auth/models/user.model.js'
import Role from '../../auth/models/role.model.js'
import Business from '../../business/models/business.model.js'
import Payment from '../../business/billing/models/payment.model.js'
import BusinessSubscription from '../../business/billing/models/business-subscription.model.js'
import VerificationCode from '../../auth/models/verification-code.model.js'
import ResetPassword from '../../auth/models/reset-password.model.js'
import { sendMailerWithAttachments } from '../../auth/auth.service.js'

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeFilename = (name) => {
  const base = String(name || 'attachment').split(/[/\\]/).pop() || 'attachment'
  return base.replace(/[^\w.\- ]+/g, '_').slice(0, 180)
}

const buildWarningEmailHtml = (messagePlain, admin) => {
  const safeMsg = escapeHtml(messagePlain)
  const safeName = escapeHtml(admin?.name || 'Administrator')
  const safeEmail = escapeHtml(admin?.email || '')
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#222;">
<p style="white-space:pre-wrap;margin:0 0 16px;">${safeMsg}</p>
<hr style="border:none;border-top:1px solid #e5dfd6;margin:20px 0;" />
<p style="margin:0;font-size:12px;color:#666;">Sent via TaraBisita admin by ${safeName} (${safeEmail}).</p>
</body></html>`
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildListFilter = async ({ search, role, whitelisted }) => {
  const conditions = []

  if (role !== 'ALL') {
    const roleDoc = await Role.findOne({ name: role }).select('_id').lean()
    if (!roleDoc) return { impossible: true }
    conditions.push({ roleId: roleDoc._id })
  }

  if (whitelisted === 'true') {
    conditions.push({ whitelisted: { $ne: false } })
  } else if (whitelisted === 'false') {
    conditions.push({ whitelisted: false })
  }

  const q = String(search || '').trim()
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i')
    conditions.push({ $or: [{ name: rx }, { email: rx }, { supportEmail: rx }] })
  }

  if (conditions.length === 0) return {}
  if (conditions.length === 1) return conditions[0]
  return { $and: conditions }
}

export const listAdminUsers = async (req, res) => {
  try {
    const { search, role, whitelisted, page, limit } = req.validatedData.query
    const filter = await buildListFilter({ search, role, whitelisted })
    if (filter.impossible) {
      return res.status(200).json({
        data: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0
      })
    }

    const total = await User.countDocuments(filter)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
    const safePage = total === 0 ? 1 : Math.min(page, totalPages)
    const skip = (safePage - 1) * limit

    const users = await User.find(filter)
      .populate('roleId', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const data = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      supportEmail: u.supportEmail || null,
      avatar: u.avatar || null,
      role: u.roleId?.name || '',
      whitelisted: u.whitelisted !== false,
      createdAt: u.createdAt
    }))

    return res.status(200).json({
      data,
      total,
      page: safePage,
      limit,
      totalPages
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const patchAdminUserWhitelist = async (req, res) => {
  try {
    const { userId } = req.validatedData.params
    const { whitelisted } = req.validatedData.body

    if (String(req.user._id) === userId) {
      return res.status(400).json({ message: 'You cannot change your own whitelist status.' })
    }

    const target = await User.findById(userId)
    if (!target) {
      return res.status(404).json({ message: 'User not found' })
    }

    await User.updateOne(
      { _id: userId },
      { $set: { whitelisted, updatedAt: new Date() } }
    )

    return res.status(200).json({
      message: 'Whitelist updated',
      data: { id: userId, whitelisted }
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.validatedData.params

    if (String(req.user._id) === userId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' })
    }

    const target = await User.findById(userId).populate('roleId')
    if (!target) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (target.roleId?.name === 'ADMIN') {
      return res.status(400).json({ message: 'Deleting admin accounts is not allowed.' })
    }

    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const businesses = await Business.find({ userId: target._id }).select('_id').session(session)
      const businessIds = businesses.map((b) => b._id)

      if (businessIds.length) {
        await Payment.deleteMany({ businessId: { $in: businessIds } }).session(session)
        await BusinessSubscription.deleteMany({ businessId: { $in: businessIds } }).session(session)
      }

      await Payment.deleteMany({ userId: target._id }).session(session)
      await BusinessSubscription.deleteMany({ userId: target._id }).session(session)
      await Business.deleteMany({ userId: target._id }).session(session)
      await VerificationCode.deleteMany({ userId: target._id }).session(session)
      await ResetPassword.deleteMany({ userId: target._id }).session(session)
      await User.deleteOne({ _id: target._id }).session(session)

      await session.commitTransaction()
    } catch (err) {
      await session.abortTransaction().catch(() => {})
      throw err
    } finally {
      session.endSession()
    }

    return res.status(200).json({ message: 'User deleted' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const postAdminUserWarningEmail = async (req, res) => {
  try {
    const { userId } = req.validatedData.params
    const { subject, message } = req.validatedData.body

    const target = await User.findById(userId).select('email name').lean()
    if (!target?.email) {
      return res.status(400).json({ message: 'User has no email address.' })
    }

    const files = Array.isArray(req.files) ? req.files : []
    const attachments = files.map((f) => ({
      filename: sanitizeFilename(f.originalname),
      content: f.buffer,
      contentType: f.mimetype || undefined
    }))

    const html = buildWarningEmailHtml(message, {
      name: req.user?.name,
      email: req.user?.email
    })

    await sendMailerWithAttachments(target.email, subject, html, attachments)

    return res.status(200).json({ message: 'Email sent successfully.' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
