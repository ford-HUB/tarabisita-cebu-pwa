import bcrypt from 'bcrypt'
import cloudinary from '../../../configs/cloudinary.js'
import User from '../../auth/models/user.model.js'
import VerificationCode from '../../auth/models/verification-code.model.js'
import { templateReader } from '../../../shared/utils/templateReaderExtractor.js'
import { sendMailer } from '../../auth/auth.service.js'
import { generateToken, generateSessionToken } from '../../../shared/utils/generateToken.js'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export const updateTouristProfileByUserId = async (userId, { name, avatar }) => {
    const updates = { updatedAt: new Date() }
    if (name !== undefined) {
        const trimmed = String(name).trim()
        if (!trimmed) {
            throw new Error('INVALID_NAME')
        }
        updates.name = trimmed
    }
    if (avatar !== undefined) {
        const v = avatar == null ? '' : String(avatar).trim()
        updates.avatar = v || null
    }
    if (Object.keys(updates).length <= 1) {
        throw new Error('NO_UPDATES')
    }
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
        .populate('roleId', 'name')
        .select('-password')
    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }
    return user
}

export const uploadTouristAccountAvatarByUserId = async (userId, avatarImage) => {
    const uploadResult = await cloudinary.uploader.upload(avatarImage, {
        folder: 'tara-bisita/tourist-account-avatar'
    })

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: uploadResult.secure_url,
                updatedAt: new Date()
            }
        },
        { new: true }
    )
        .populate('roleId', 'name')
        .select('-password')

    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    return user
}

export const changeTouristPasswordByUserId = async (userId, payload) => {
    const { currentPassword, newPassword } = payload
    const user = await User.findById(userId)

    if (!user) {
        throw new Error('USER_NOT_FOUND')
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
    const hashedPassword = await bcrypt.hash(newPassword, genSalt)

    await User.findByIdAndUpdate(userId, {
        $set: {
            password: hashedPassword,
            updatedAt: new Date()
        }
    })
}

export const requestTouristEmailChange = async (userId, newEmailRaw) => {
    const newEmail = normalizeEmail(newEmailRaw)
    if (!newEmail) {
        throw new Error('INVALID_EMAIL')
    }

    const user = await User.findById(userId).select('email supportEmail')
    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    const currentNorm = normalizeEmail(user.email)
    if (newEmail === currentNorm) {
        throw new Error('EMAIL_UNCHANGED')
    }

    if (newEmail === normalizeEmail(user.supportEmail)) {
        throw new Error('EMAIL_SAME_AS_SUPPORT')
    }
    const taken = await User.findOne({
        _id: { $ne: userId },
        $or: [{ email: newEmail }, { supportEmail: newEmail }]
    })
        .select('_id')
        .lean()
    if (taken) {
        throw new Error('EMAIL_IN_USE')
    }

    await VerificationCode.deleteMany({
        userId,
        purpose: 'EMAIL_CHANGE',
        used: false
    })

    const genCode = await generateToken()
    const genSessionToken = await generateSessionToken()

    const verificationCode = await VerificationCode.create([
        {
            userId,
            sessionToken: genSessionToken,
            code: genCode,
            expiresAt: Date.now() + 10 * 60 * 1000,
            purpose: 'EMAIL_CHANGE',
            pendingEmail: newEmail
        }
    ])

    const html = templateReader('verification-code', {
        code: verificationCode[0].code
    })

    await sendMailer(newEmail, '[TaraBisita] Verify your new email', html)

    return {
        sessionToken: verificationCode[0].sessionToken,
        expiresAt: verificationCode[0].expiresAt
    }
}

export const resendTouristEmailChangeCode = async (userId, sessionToken) => {
    const record = await VerificationCode.findOne({ sessionToken, purpose: 'EMAIL_CHANGE', used: false })
    if (!record || String(record.userId) !== String(userId)) {
        throw new Error('EMAIL_CHANGE_SESSION_NOT_FOUND')
    }
    if (Date.now() > new Date(record.expiresAt).getTime()) {
        throw new Error('EMAIL_CHANGE_EXPIRED')
    }
    const pending = normalizeEmail(record.pendingEmail)
    if (!pending) {
        throw new Error('EMAIL_CHANGE_INVALID')
    }

    const genCode = await generateToken()
    const updated = await VerificationCode.findOneAndUpdate(
        { _id: record._id },
        { $set: { code: genCode, expiresAt: Date.now() + 10 * 60 * 1000, updatedAt: new Date() } },
        { new: true }
    )

    const html = templateReader('verification-code', {
        code: updated.code
    })

    await sendMailer(pending, '[TaraBisita] Verify your new email', html)

    return { expiresAt: updated.expiresAt }
}

export const confirmTouristEmailChange = async (userId, sessionToken, code) => {
    const record = await VerificationCode.findOne({ sessionToken, purpose: 'EMAIL_CHANGE' })
    if (!record || String(record.userId) !== String(userId)) {
        throw new Error('EMAIL_CHANGE_SESSION_NOT_FOUND')
    }
    if (record.used) {
        throw new Error('EMAIL_CHANGE_ALREADY_USED')
    }
    if (Date.now() > new Date(record.expiresAt).getTime()) {
        throw new Error('EMAIL_CHANGE_EXPIRED')
    }
    if (String(record.code) !== String(code)) {
        throw new Error('INVALID_VERIFICATION_CODE')
    }

    const pending = normalizeEmail(record.pendingEmail)
    if (!pending) {
        throw new Error('EMAIL_CHANGE_INVALID')
    }

    const taken = await User.findOne({
        _id: { $ne: userId },
        $or: [{ email: pending }, { supportEmail: pending }]
    })
        .select('_id')
        .lean()
    if (taken) {
        throw new Error('EMAIL_IN_USE')
    }

    const prior = await User.findById(userId).select('supportEmail').lean()
    const updateOps = {
        $set: { email: pending, updatedAt: new Date() }
    }
    if (normalizeEmail(prior?.supportEmail) === pending) {
        updateOps.$unset = { supportEmail: 1 }
    }

    const user = await User.findByIdAndUpdate(userId, updateOps, { new: true })
        .populate('roleId', 'name')
        .select('-password')

    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    await VerificationCode.findOneAndUpdate({ _id: record._id }, { $set: { used: true, updatedAt: new Date() } })

    return user
}

export const updateTouristSupportEmailByUserId = async (userId, supportEmailRaw) => {
    const raw = supportEmailRaw == null ? '' : String(supportEmailRaw).trim()
    if (raw) {
        throw new Error('SUPPORT_EMAIL_USE_VERIFICATION')
    }

    const cleared = await User.findByIdAndUpdate(
        userId,
        { $unset: { supportEmail: 1 }, $set: { updatedAt: new Date() } },
        { new: true }
    )
        .populate('roleId', 'name')
        .select('-password')
    if (!cleared) {
        throw new Error('USER_NOT_FOUND')
    }
    return cleared
}

export const requestTouristSupportEmailVerification = async (userId, newSupportRaw) => {
    const pending = normalizeEmail(newSupportRaw)
    if (!pending) {
        throw new Error('INVALID_EMAIL')
    }

    const user = await User.findById(userId).select('email supportEmail')
    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    if (pending === normalizeEmail(user.email)) {
        throw new Error('SUPPORT_EMAIL_SAME_AS_PRIMARY')
    }

    if (pending === normalizeEmail(user.supportEmail)) {
        throw new Error('SUPPORT_EMAIL_UNCHANGED')
    }

    const taken = await User.findOne({
        _id: { $ne: userId },
        $or: [{ email: pending }, { supportEmail: pending }]
    })
        .select('_id')
        .lean()
    if (taken) {
        throw new Error('SUPPORT_EMAIL_IN_USE')
    }

    await VerificationCode.deleteMany({
        userId,
        purpose: 'SUPPORT_EMAIL',
        used: false
    })

    const genCode = await generateToken()
    const genSessionToken = await generateSessionToken()

    const verificationCode = await VerificationCode.create([
        {
            userId,
            sessionToken: genSessionToken,
            code: genCode,
            expiresAt: Date.now() + 10 * 60 * 1000,
            purpose: 'SUPPORT_EMAIL',
            pendingEmail: pending
        }
    ])

    const html = templateReader('verification-code', {
        code: verificationCode[0].code
    })

    await sendMailer(pending, '[TaraBisita] Verify your support email', html)

    return {
        sessionToken: verificationCode[0].sessionToken,
        expiresAt: verificationCode[0].expiresAt
    }
}

export const resendTouristSupportEmailVerification = async (userId, sessionToken) => {
    const record = await VerificationCode.findOne({ sessionToken, purpose: 'SUPPORT_EMAIL', used: false })
    if (!record || String(record.userId) !== String(userId)) {
        throw new Error('SUPPORT_EMAIL_SESSION_NOT_FOUND')
    }
    if (Date.now() > new Date(record.expiresAt).getTime()) {
        throw new Error('SUPPORT_EMAIL_SESSION_EXPIRED')
    }
    const pending = normalizeEmail(record.pendingEmail)
    if (!pending) {
        throw new Error('SUPPORT_EMAIL_SESSION_INVALID')
    }

    const genCode = await generateToken()
    const updated = await VerificationCode.findOneAndUpdate(
        { _id: record._id },
        { $set: { code: genCode, expiresAt: Date.now() + 10 * 60 * 1000, updatedAt: new Date() } },
        { new: true }
    )

    const html = templateReader('verification-code', {
        code: updated.code
    })

    await sendMailer(pending, '[TaraBisita] Verify your support email', html)

    return { expiresAt: updated.expiresAt }
}

export const confirmTouristSupportEmailVerification = async (userId, sessionToken, code) => {
    const record = await VerificationCode.findOne({ sessionToken, purpose: 'SUPPORT_EMAIL' })
    if (!record || String(record.userId) !== String(userId)) {
        throw new Error('SUPPORT_EMAIL_SESSION_NOT_FOUND')
    }
    if (record.used) {
        throw new Error('SUPPORT_EMAIL_SESSION_USED')
    }
    if (Date.now() > new Date(record.expiresAt).getTime()) {
        throw new Error('SUPPORT_EMAIL_SESSION_EXPIRED')
    }
    if (String(record.code) !== String(code)) {
        throw new Error('INVALID_VERIFICATION_CODE')
    }

    const pending = normalizeEmail(record.pendingEmail)
    if (!pending) {
        throw new Error('SUPPORT_EMAIL_SESSION_INVALID')
    }

    const taken = await User.findOne({
        _id: { $ne: userId },
        $or: [{ email: pending }, { supportEmail: pending }]
    })
        .select('_id')
        .lean()
    if (taken) {
        throw new Error('SUPPORT_EMAIL_IN_USE')
    }

    const me = await User.findById(userId).select('email').lean()
    if (!me) {
        throw new Error('USER_NOT_FOUND')
    }
    if (pending === normalizeEmail(me.email)) {
        throw new Error('SUPPORT_EMAIL_SAME_AS_PRIMARY')
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { supportEmail: pending, updatedAt: new Date() } },
        { new: true }
    )
        .populate('roleId', 'name')
        .select('-password')

    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    await VerificationCode.findOneAndUpdate({ _id: record._id }, { $set: { used: true, updatedAt: new Date() } })

    return user
}
