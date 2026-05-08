import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from './models/user.model.js'
import Role from './models/role.model.js'
import { generateAccessToken } from '../../shared/utils/generateJwt.js'
import { generateToken, generateResetToken, generateSessionToken } from '../../shared/utils/generateToken.js'
import { templateReader } from '../../shared/utils/templateReaderExtractor.js'
import { sendMailer } from './auth.service.js'
import VerificationCode from './models/verification-code.model.js'
import ResetPasswordModel from './models/reset-password.model.js'
import Business from '../business/models/business.model.js'
import Category from '../business/models/category.model.js'
import ActivityLog from './models/activity-log.model.js'
import { BUSINESS_CATEGORY_LABELS } from '../../shared/constants/businessCategories.js'

// Backward-compatible alias for any lingering ResetPassword references.
const ResetPassword = ResetPasswordModel

const isProduction = process.env.NODE_ENV === 'production'

const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
}

const extractRequestMeta = (req) => {
    const forwardedFor = req.headers['x-forwarded-for']
    const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : String(forwardedFor || req.ip || '').split(',')[0].trim()
    const userAgent = String(req.headers['user-agent'] || '')
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'MOBILE' : 'WEB_DESKTOP'
    return { ipAddress, userAgent, device }
}

const createBusinessAuthActivityLog = async ({ req, user, action, status = 'SUCCESS', description, failureReason = '' }) => {
    if (!user || user?.roleId?.name !== 'BUSINESS') return

    const business = await Business.findOne({ userId: user._id }).select('_id')
    if (!business) return

    const { ipAddress, userAgent, device } = extractRequestMeta(req)

    await ActivityLog.create({
        actorUserId: user._id,
        actorRole: 'BUSINESS',
        scopeType: 'BUSINESS',
        scopeId: business._id,
        action,
        category: 'ACCOUNT_SECURITY',
        severity: status === 'FAILED' ? 'HIGH' : 'MEDIUM',
        status,
        description,
        details: {
            authAction: action
        },
        ipAddress,
        userAgent,
        device,
        failureReason
    })
}

export const register = async (req, res) => {
    const session = await mongoose.startSession()
    try {
        const { name, email, password, accountType, businessName, businessDescription, businessAddress, businessContact, businessCategory } = req.validatedData.body

        await session.withTransaction(async () => {
            const existingUser = await User.findOne({ email }).select('_id').session(session)
            if (existingUser) {
                const duplicateError = new Error('Email is already registered')
                duplicateError.statusCode = 409
                throw duplicateError
            }

            const genSalt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, genSalt)

            let role = await Role.findOne({ name: accountType }).session(session)
            if (!role) {
                role = new Role({
                    name: accountType,
                    description: `This role can access the ${accountType} side of features.`
                })
                await role.save({ session })
            }

            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                roleId: role._id
            })
            await newUser.save({ session })

            if (accountType === 'BUSINESS') {
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

                const business = new Business({
                    userId: newUser._id,
                    name: businessName,
                    description: businessDescription,
                    address: businessAddress,
                    contact_info: { phone: businessContact },
                    category: foundCategory._id
                })
                await business.save({ session })
            }
        })

        return res.status(201).json({ message: "User registered successfully" })
    } catch (error) {
        if (error?.statusCode === 409 || (error?.code === 11000 && error?.keyPattern?.email)) {
            return res.status(409).json({ message: "Email is already registered" })
        }
        return res.status(500).json({ message: error.message })
    } finally {
        session.endSession()
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.validatedData.body

        const user = await User.findOne({ email }).populate('roleId')

        if (!user) {
            return res.status(404).json({ message: "Invalid Credentials" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            await createBusinessAuthActivityLog({
                req,
                user,
                action: 'LOGIN_FAILED',
                status: 'FAILED',
                description: 'Business login failed due to invalid password.',
                failureReason: 'INVALID_PASSWORD'
            })
            return res.status(401).json({ message: "Invalid password" })
        }

        if (user.whitelisted === false) {
            await createBusinessAuthActivityLog({
                req,
                user,
                action: 'LOGIN_FAILED',
                status: 'FAILED',
                description: 'Login blocked: account is not whitelisted.',
                failureReason: 'NOT_WHITELISTED'
            })
            return res.status(403).json({
                message: 'This account cannot sign in. Contact support if you believe this is a mistake.'
            })
        }

        generateAccessToken(user, res)
        await createBusinessAuthActivityLog({
            req,
            user,
            action: 'LOGIN_SUCCESS',
            status: 'SUCCESS',
            description: 'Business account login successful.'
        })
        return res.status(200).json({
            properties: {
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.roleId.name,
                    avatar: user.avatar || null
                }
            }, message: "User logged in successfully"
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        await createBusinessAuthActivityLog({
            req,
            user: req.user,
            action: 'LOGOUT_SUCCESS',
            status: 'SUCCESS',
            description: 'Business account logout successful.'
        })
        res.clearCookie('accessToken', clearCookieOptions)
        res.clearCookie('refreshToken', clearCookieOptions)
        return res.status(200).json({ message: "User logged out successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.validatedData.body

        console.log(email)
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const genCode = await generateToken()
        const genSessionToken = await generateSessionToken()

        const verificationCode = await VerificationCode.create([
            { userId: user._id, sessionToken: genSessionToken, code: genCode, expiresAt: Date.now() + 10 * 60 * 1000 }
        ])

        const html = templateReader('verification-code', {
            code: verificationCode[0].code
        })

        await sendMailer(email, '[TaraBisita] Sudo email verification code', html)

        return res.status(200).json({
            properties: {
                sessionToken: verificationCode[0].sessionToken,
                expiresAt: verificationCode[0].expiresAt
            }, message: "Verification code sent successfully"
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const verifyCode = async (req, res) => {
    try {
        const { sessionToken, code } = req.validatedData.body
        const verificationCodeExists = await VerificationCode.findOne({ sessionToken })
        if (!verificationCodeExists) {
            return res.status(404).json({ message: "Verification code not found" })
        }

        const verificationCode = await VerificationCode.findOne({ userId: verificationCodeExists.userId, code })

        if (!verificationCode) {
            return res.status(404).json({ message: "Verification code not found" })
        }

        if (verificationCode.code !== code) {
            return res.status(400).json({ message: "Invalid verification code" })
        }

        await VerificationCode.findOneAndUpdate(
            { sessionToken: sessionToken },
            { $set: { used: true } },
            { returnDocument: 'after' }
        )

        await User.findByIdAndUpdate(
            verificationCodeExists.userId,
            { $set: { isEmailVerified: true, emailVerifiedAt: new Date() } },
            { new: false }
        )

        return res.status(200).json({ message: "Verification code sent successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const resendVerificationCode = async (req, res) => {
    try {
        const { sessionToken } = req.validatedData.body
        const verificationCodeExists = await VerificationCode.findOne({ sessionToken })
        if (!verificationCodeExists) {
            return res.status(404).json({ message: "Session token not found" })
        }
        const user = await User.findById(verificationCodeExists.userId).select('email')
        if (!user?.email) {
            return res.status(404).json({ message: "User not found" })
        }

        const genCode = await generateToken()

        const verificationCode = await VerificationCode.findOneAndUpdate(
            { sessionToken: sessionToken },
            { $set: { code: genCode, expiresAt: Date.now() + 10 * 60 * 1000 } },
            { returnDocument: 'after' }
        )

        const html = templateReader('verification-code', {
            code: verificationCode.code
        })

        await sendMailer(user.email, '[TaraBisita] Sudo email verification code', html)

        return res.status(200).json({
            properties: {
                expiresAt: verificationCode.expiresAt
            }, message: "Verification code sent successfully"
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const sendRequestedResetPassword = async (req, res) => {
    try {
        const { email } = req.validatedData.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const genCode = await generateResetToken()

        const resetPassword = await ResetPasswordModel.create([
            { userId: user._id, token: genCode, expiresAt: Date.now() + 10 * 60 * 1000 }
        ])

        const html = templateReader('forget-password', {
            resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetPassword[0].token}`
        })

        await sendMailer(email, '[TaraBisita] Sudo email verification code', html)

        return res.status(200).json({ message: "Verification code sent successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.validatedData.body
        const resetPassword = await ResetPasswordModel.findOne({ token })
        if (!resetPassword) {
            return res.status(404).json({ message: "Reset password not found" })
        }

        const genSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, genSalt)

        await User.findOneAndUpdate(
            { _id: resetPassword.userId },
            { $set: { password: hashedPassword } },
            { returnDocument: 'after' }
        )

        await ResetPasswordModel.findOneAndUpdate(
            { token: token },
            { $set: { used: true } },
            { returnDocument: 'after' }
        )

        return res.status(200).json({ message: "Password reset successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * Users who completed OTP verification before `User.isEmailVerified` existed (or if the flag was never written)
 * still have a used signup `VerificationCode`. Treat that as verified and optionally backfill the user row.
 */
const getSignupEmailVerifiedFromCodes = async (userId) => {
    const record = await VerificationCode.findOne({
        userId,
        used: true,
        purpose: { $ne: 'EMAIL_CHANGE' }
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

export const internalEmailChecker = async (req, res) => {
    try {
        const { email } = req.validatedData.body
        const user = await User.findOne({ email })
            .select('_id isEmailVerified emailVerifiedAt roleId')
            .populate('roleId', 'name')
        if (!user) {
            return res.status(404).json({
                message: "System cannot find your email existance",
                properties: {
                    exists: false,
                    isEmailVerified: false,
                    accountRole: null
                }
            })
        }
        const accountRole = user.roleId?.name ? String(user.roleId.name) : null

        let isEmailVerified = Boolean(user.isEmailVerified)
        let emailVerifiedAt = user.emailVerifiedAt || null

        if (!isEmailVerified) {
            const inferred = await getSignupEmailVerifiedFromCodes(user._id)
            if (inferred.verified) {
                isEmailVerified = true
                emailVerifiedAt = inferred.verifiedAt
                await User.updateOne(
                    { _id: user._id },
                    { $set: { isEmailVerified: true, emailVerifiedAt: inferred.verifiedAt } }
                )
            }
        }

        return res.status(200).json({
            message: "System found your email existance",
            properties: {
                exists: true,
                isEmailVerified,
                emailVerifiedAt,
                accountRole
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const checkUser = async (req, res) => {
    try {
        const user = req.user
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        let businessVerificationStatus = null
        let businessLogo = null
        let businessCategory = null
        let businessCategoryLabel = null

        if (user.roleId.name === 'BUSINESS') {
            const business = await Business.findOne({ userId: user._id })
                .populate('category', 'name')
                .select('verificationStatus logo category')
            businessVerificationStatus = business?.verificationStatus || null
            businessLogo = business?.logo || null
            businessCategory = business?.category?.name || null
            businessCategoryLabel = businessCategory ? (BUSINESS_CATEGORY_LABELS[businessCategory] || businessCategory) : null
        }

        return res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.roleId.name,
                avatar: user.avatar || null,
                businessVerificationStatus,
                businessLogo,
                businessCategory,
                businessCategoryLabel
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

