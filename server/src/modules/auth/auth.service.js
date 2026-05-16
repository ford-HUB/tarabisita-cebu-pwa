import bcrypt from 'bcrypt'
import { sendEmail } from '../../shared/utils/send-email.js'
import User from './models/user.model.js'
import Role from './models/role.model.js'
import VerificationCode from './models/verification-code.model.js'
import Business from '../business/models/business.model.js'
import Category from '../business/models/category.model.js'
import { BUSINESS_CATEGORY_LABELS } from '../../shared/constants/businessCategories.js'

export const sendMailer = async (to, subject, html) => {
    const message = await sendEmail({
        to,
        subject,
        html
    })

    return message
}

export const sendMailerWithAttachments = async (to, subject, html, attachments = []) => {
    const message = await sendEmail({
        to,
        subject,
        html,
        attachments
    })

    return message
}

export const getSignupEmailVerifiedFromCodes = async (userId) => {
    const record = await VerificationCode.findOne({
        userId,
        used: true,
        purpose: 'DEFAULT'
    })
        .sort({ updatedAt: -1 })
        .select('updatedAt createdAt')
        .lean()

    if (!record) {
        return { verified: false, verifiedAt: null }
    }

    const verifiedAt = record.updatedAt || record.createdAt || new Date()
    return { verified: true, verifiedAt }
}

export const normalizeLoginEmail = (email) => String(email || '').trim().toLowerCase()

/** Query user by primary or support email (normalized). Returns null if input is empty. */
export const findUserByLoginIdentifier = (emailRaw) => {
    const email = normalizeLoginEmail(emailRaw)
    if (!email) return null
    return User.findOne({
        $or: [{ email }, { supportEmail: email }]
    })
}

export const resolveUserEmailVerification = async (user) => {
    let isEmailVerified = Boolean(user.isEmailVerified)
    let emailVerifiedAt = user.emailVerifiedAt || null

    if (!isEmailVerified) {
        const inferred = await getSignupEmailVerifiedFromCodes(user._id)
        if (inferred.verified) {
            isEmailVerified = true
            emailVerifiedAt = inferred.verifiedAt
        }
    }

    return { isEmailVerified, emailVerifiedAt }
}

const createDuplicateEmailError = () => {
    const duplicateError = new Error('Email is already registered')
    duplicateError.statusCode = 409
    return duplicateError
}

const ensureRole = async ({ session, accountType }) => {
    let role = await Role.findOne({ name: accountType }).session(session)
    if (!role) {
        role = new Role({
            name: accountType,
            description: `This role can access the ${accountType} side of features.`
        })
        await role.save({ session })
    }

    return role
}

const ensureBusinessCategory = async ({ session, businessCategory }) => {
    const normalizedCategory = String(businessCategory || '').trim().toUpperCase()
    const categoryLabel = BUSINESS_CATEGORY_LABELS[normalizedCategory] || normalizedCategory
    let foundCategory = await Category.findOne({
        $or: [{ name: normalizedCategory }, { name: categoryLabel }]
    }).session(session)

    if (!foundCategory) {
        foundCategory = new Category({
            name: normalizedCategory,
            description: `${categoryLabel} category`
        })
        await foundCategory.save({ session })
    }

    return foundCategory
}

const upsertBusinessForUser = async ({
    session,
    userId,
    businessName,
    businessDescription,
    businessAddress,
    businessContact,
    businessCategory
}) => {
    const foundCategory = await ensureBusinessCategory({ session, businessCategory })

    await Business.findOneAndUpdate(
        { userId },
        {
            $set: {
                name: businessName,
                description: businessDescription,
                address: businessAddress,
                contact_info: { phone: businessContact },
                category: foundCategory._id
            }
        },
        { session, upsert: true, new: true, setDefaultsOnInsert: true }
    )
}

export const registerUserAccount = async ({
    session,
    name,
    email,
    password,
    accountType,
    businessName,
    businessDescription,
    businessAddress,
    businessContact,
    businessCategory
}) => {
    const normEmail = normalizeLoginEmail(email)
    const existingUser = await User.findOne({
        $or: [{ email: normEmail }, { supportEmail: normEmail }]
    })
        .select('_id isEmailVerified emailVerifiedAt email supportEmail')
        .session(session)

    const genSalt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, genSalt)
    const role = await ensureRole({ session, accountType })

    if (existingUser) {
        const matchedPrimary = normalizeLoginEmail(existingUser.email) === normEmail
        const matchedSupportOnly =
            !matchedPrimary && normalizeLoginEmail(existingUser.supportEmail) === normEmail
        if (matchedSupportOnly) {
            throw createDuplicateEmailError()
        }

        if (Boolean(existingUser.isEmailVerified)) {
            throw createDuplicateEmailError()
        }

        await User.updateOne(
            { _id: existingUser._id },
            {
                $set: {
                    name,
                    email: normEmail,
                    password: hashedPassword,
                    roleId: role._id,
                    isEmailVerified: false,
                    emailVerifiedAt: null,
                    updatedAt: new Date()
                }
            },
            { session }
        )

        await VerificationCode.deleteMany({ userId: existingUser._id }).session(session)

        if (accountType === 'BUSINESS') {
            await upsertBusinessForUser({
                session,
                userId: existingUser._id,
                businessName,
                businessDescription,
                businessAddress,
                businessContact,
                businessCategory
            })
        } else {
            await Business.deleteOne({ userId: existingUser._id }).session(session)
        }

        return existingUser._id
    }

    const newUser = new User({
        name,
        email: normEmail,
        password: hashedPassword,
        roleId: role._id
    })
    await newUser.save({ session })

    if (accountType === 'BUSINESS') {
        await upsertBusinessForUser({
            session,
            userId: newUser._id,
            businessName,
            businessDescription,
            businessAddress,
            businessContact,
            businessCategory
        })
    }

    return newUser._id
}
