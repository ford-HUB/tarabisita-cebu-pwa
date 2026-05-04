import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../../auth/models/user.model.js'
import Role from '../../auth/models/role.model.js'
import { generateAccessToken } from '../../../shared/utils/generateJwt.js'
import { generateToken, generateResetToken, generateSessionToken } from '../../../shared/utils/generateToken.js'
import { templateReader } from '../../../shared/utils/templateReaderExtractor.js'
import { sendMailer } from '../../auth/auth.service.js'
import VerificationCode from '../../auth/models/verification-code.model.js'
import ResetPasswordModel from '../../auth/models/reset-password.model.js'
import Business from '../models/business.model.js'
import Category from '../models/category.model.js'
import ActivityLog from '../../auth/models/activity-log.model.js'
import { BUSINESS_CATEGORY_LABELS } from '../../../shared/constants/businessCategories.js'

// Backward-compatible alias for any lingering ResetPassword references.
const ResetPassword = ResetPasswordModel

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
        session.startTransaction()
        const { name, email, password, accountType, businessName, businessDescription, businessAddress, businessContact, businessCategory } = req.validatedData.body

        console.log(req.validatedData.body)

        const genSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, genSalt)

        const newRole = await Role.create([
            { name: accountType, description: `This role can access the ${accountType} side of features.` }
        ], { session })

        const newUser = await User.create([
            { name, email, password: hashedPassword, roleId: newRole[0]._id }
        ], { session })

        if (accountType === 'BUSINESS') {
            const normalizedCategory = String(businessCategory || '').trim().toUpperCase()
            const categoryLabel = BUSINESS_CATEGORY_LABELS[normalizedCategory] || normalizedCategory
            let foundCategory = await Category.findOne({
                $or: [{ name: normalizedCategory }, { name: categoryLabel }]
            }).session(session)
            if (!foundCategory) {
                const createdCategory = await Category.create([
                    {
                        name: normalizedCategory,
                        description: `${categoryLabel} category`
                    }
                ], { session })
                foundCategory = createdCategory[0]
            }

            await Business.create([
                { userId: newUser[0]._id, name: businessName, description: businessDescription, address: businessAddress, contact_info: { phone: businessContact }, category: foundCategory._id }
            ], { session })
        }

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({ message: "User registered successfully" })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message })
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
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
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

        const genCode = await generateToken()

        const verificationCode = await VerificationCode.findOneAndUpdate(
            { sessionToken: sessionToken },
            { $set: { code: genCode, expiresAt: Date.now() + 10 * 60 * 1000 } },
            { returnDocument: 'after' }
        )

        const html = templateReader('verification-code', {
            code: verificationCode.code
        })

        await sendMailer(email, '[TaraBisita] Sudo email verification code', html)

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

export const internalEmailChecker = async (req, res) => {
    try {
        const { email } = req.validatedData.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "System cannot find your email existance" })
        }
        return res.status(200).json({ message: "System found your email existance" })
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

