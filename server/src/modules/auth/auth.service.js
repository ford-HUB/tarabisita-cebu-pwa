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

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getSignupEmailVerifiedFromCodes = async (userId) => {
    const record = await VerificationCode.findOne({
        userId,
        used: true,
        $or: [{ purpose: 'DEFAULT' }, { purpose: { $exists: false } }]
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

/** How a normalized email matches an existing user row (case-insensitive). */
export const getEmailIdentifierMatch = (user, normEmail) => {
    const matchedPrimary = normalizeLoginEmail(user?.email) === normEmail
    const matchedSupportOnly =
        !matchedPrimary && normalizeLoginEmail(user?.supportEmail) === normEmail
    return { matchedPrimary, matchedSupportOnly }
}

/** Query user by primary or support email (normalized, case-insensitive). Returns null if input is empty. */
export const findUserByLoginIdentifier = (emailRaw) => {
    const email = normalizeLoginEmail(emailRaw)
    if (!email) return null

    const pattern = new RegExp(`^${escapeRegex(email)}$`, 'i')
    return User.findOne({
        $or: [{ email: pattern }, { supportEmail: pattern }]
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

export const REGISTRATION_ERROR_CODES = {
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    REGISTRATION_FAILED: 'REGISTRATION_FAILED',
    PROFILE_SETUP_FAILED: 'PROFILE_SETUP_FAILED'
}

export class RegistrationError extends Error {
    constructor(message, { statusCode = 500, code = REGISTRATION_ERROR_CODES.REGISTRATION_FAILED } = {}) {
        super(message)
        this.name = 'RegistrationError'
        this.statusCode = statusCode
        this.code = code
    }
}

const createDuplicateEmailError = () =>
    new RegistrationError('This email is already registered.', {
        statusCode: 409,
        code: REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL
    })

const createProfileSetupError = (message = 'Failed to create account. Business profile could not be saved.') =>
    new RegistrationError(message, {
        statusCode: 500,
        code: REGISTRATION_ERROR_CODES.PROFILE_SETUP_FAILED
    })

const createRegistrationFailedError = (message = 'Failed to create account. Please try again.') =>
    new RegistrationError(message, {
        statusCode: 500,
        code: REGISTRATION_ERROR_CODES.REGISTRATION_FAILED
    })

/** True when MongoDB reports a duplicate on login email or a set support email (not missing/null). */
export const isDuplicateEmailKeyError = (error) => {
    if (error?.code !== 11000) {
        return false
    }

    if (error.keyPattern?.email) {
        return true
    }

    const supportValue = error.keyValue?.supportEmail
    return Boolean(
        error.keyPattern?.supportEmail && supportValue !== null && supportValue !== undefined && supportValue !== ''
    )
}

/**
 * Registration-time email availability (read-only).
 * Uses persisted `isEmailVerified` only — does not infer from verification codes.
 */
export const getRegistrationEmailAvailability = async (emailRaw, { session } = {}) => {
    const normEmail = normalizeLoginEmail(emailRaw)
    if (!normEmail) {
        return {
            exists: false,
            isEmailVerified: false,
            canReuseForSignup: false,
            registrationBlocked: false,
            accountRole: null
        }
    }

    let query = findUserByLoginIdentifier(emailRaw)
    if (!query) {
        return {
            exists: false,
            isEmailVerified: false,
            canReuseForSignup: false,
            registrationBlocked: false,
            accountRole: null
        }
    }

    if (session) {
        query = query.session(session)
    }

    const user = await query.select('_id isEmailVerified email supportEmail roleId').populate('roleId', 'name')
    if (!user) {
        return {
            exists: false,
            isEmailVerified: false,
            canReuseForSignup: false,
            registrationBlocked: false,
            accountRole: null
        }
    }

    const accountRole = user.roleId?.name ? String(user.roleId.name) : null
    const isEmailVerified = Boolean(user.isEmailVerified)
    const { matchedSupportOnly } = getEmailIdentifierMatch(user, normEmail)
    const canReuseForSignup = !matchedSupportOnly && !isEmailVerified
    const registrationBlocked = matchedSupportOnly || isEmailVerified

    return {
        exists: true,
        isEmailVerified,
        canReuseForSignup,
        registrationBlocked,
        accountRole
    }
}

const validateBusinessProfileInput = ({
    businessName,
    businessDescription,
    businessAddress,
    businessContact,
    businessCategory
}) => {
    const required = [
        ['businessName', businessName, 'Business name is required'],
        ['businessDescription', businessDescription, 'Business description is required'],
        ['businessAddress', businessAddress, 'Business address is required'],
        ['businessContact', businessContact, 'Business contact is required'],
        ['businessCategory', businessCategory, 'Business category is required']
    ]

    for (const [, value, message] of required) {
        if (!String(value || '').trim()) {
            const validationError = new RegistrationError(message, {
                statusCode: 400,
                code: 'VALIDATION_FAILED'
            })
            throw validationError
        }
    }

    const contact = String(businessContact || '').trim()
    if (!/^\d+$/.test(contact)) {
        throw new RegistrationError('Business contact must contain numbers only.', {
            statusCode: 400,
            code: 'VALIDATION_FAILED'
        })
    }
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

const saveBusinessProfileForUser = async (params) => {
    try {
        await upsertBusinessForUser(params)
    } catch (error) {
        if (error instanceof RegistrationError) {
            throw error
        }
        throw createProfileSetupError()
    }
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

    if (accountType === 'BUSINESS') {
        validateBusinessProfileInput({
            businessName,
            businessDescription,
            businessAddress,
            businessContact,
            businessCategory
        })
    }

    const emailAvailability = await getRegistrationEmailAvailability(email, { session })
    if (emailAvailability.registrationBlocked) {
        throw createDuplicateEmailError()
    }

    let hashedPassword
    let role
    try {
        const genSalt = await bcrypt.genSalt(10)
        hashedPassword = await bcrypt.hash(password, genSalt)
        role = await ensureRole({ session, accountType })
    } catch (error) {
        if (error instanceof RegistrationError) {
            throw error
        }
        throw createRegistrationFailedError()
    }

    const persistBusinessProfile = async (userId) => {
        if (accountType !== 'BUSINESS') {
            await Business.deleteOne({ userId }).session(session)
            return
        }

        await saveBusinessProfileForUser({
            session,
            userId,
            businessName,
            businessDescription,
            businessAddress,
            businessContact,
            businessCategory
        })
    }

    if (emailAvailability.exists && emailAvailability.canReuseForSignup) {
        const existingQuery = findUserByLoginIdentifier(email)
        const existingUser = existingQuery
            ? await existingQuery.select('_id email supportEmail').session(session)
            : null

        if (!existingUser) {
            throw createRegistrationFailedError()
        }

        try {
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
            await persistBusinessProfile(existingUser._id)
        } catch (error) {
            if (isDuplicateEmailKeyError(error)) {
                throw createDuplicateEmailError()
            }
            if (error instanceof RegistrationError) {
                throw error
            }
            throw createRegistrationFailedError()
        }

        return existingUser._id
    }

    try {
        const newUser = new User({
            name,
            email: normEmail,
            password: hashedPassword,
            roleId: role._id
        })
        await newUser.save({ session })
        await persistBusinessProfile(newUser._id)
        return newUser._id
    } catch (error) {
        if (isDuplicateEmailKeyError(error)) {
            throw createDuplicateEmailError()
        }
        if (error instanceof RegistrationError) {
            throw error
        }
        throw createRegistrationFailedError()
    }
}
