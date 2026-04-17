import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from "../user/User.model.js";
import Role from "./Role.model.js";
import { generateAccessToken } from "../shared/utils/generateJwt.js";
import { generateToken, generateResetToken, generateSessionToken } from "../shared/utils/generateToken.js";
import { templateReader } from '../shared/utils/templateReaderExtractor.js';
import { sendMailer } from './auth.service.js';
import VerificationCode from './VerificationCode.model.js';
import ResetPassword from './ResetPassword.model.js';
import Business from '../business/Business.model.js';
import Category from '../business/Category.model.js';

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
            let foundCategory = await Category.findOne({ name: businessCategory })
            if (!foundCategory) {
                const newCategory = await Category.create([
                    { name: businessCategory, description: `${businessCategory} category` }
                ], { session })
                foundCategory = newCategory[0]
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
            return res.status(401).json({ message: "Invalid password" })
        }

        generateAccessToken(user, res)
        return res.status(200).json({
            properties: {
                role: user.roleId.name
            }, message: "User logged in successfully"
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
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
            { new: true }
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
            { new: true }
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

        const resetPassword = await ResetPassword.create([
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
        const resetPassword = await ResetPassword.findOne({ token })
        if (!resetPassword) {
            return res.status(404).json({ message: "Reset password not found" })
        }

        const genSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, genSalt)

        await User.findOneAndUpdate(
            { _id: resetPassword.userId },
            { $set: { password: hashedPassword } },
            { new: true }
        )

        await ResetPassword.findOneAndUpdate(
            { token: token },
            { $set: { used: true } },
            { new: true }
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
        return res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.roleId.name
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

