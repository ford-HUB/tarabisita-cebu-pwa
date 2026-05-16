import zod from 'zod'
import { BUSINESS_CATEGORIES } from '../../shared/constants/businessCategories.js'

const businessCategoryEnum = zod.enum(BUSINESS_CATEGORIES)

export const registerSchema = zod.object({
    body: zod.object({
        name: zod.string().min(1, 'Name is required'),
        email: zod.string().email('Invalid email').transform((value) => value.trim().toLowerCase()),
        password: zod.string().min(1, 'Password is required'),
        confirmPassword: zod.string().min(1, 'Confirm password is required'),

        accountType: zod.enum(['TOURIST', 'BUSINESS', 'ADMIN']),
        businessName: zod.string().optional(),
        businessDescription: zod.string().optional(),
        businessAddress: zod.string().optional(),
        businessContact: zod.string().optional(),
        businessCategory: businessCategoryEnum.optional(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    }).refine((data) => {
        if (data.accountType !== 'BUSINESS') {
            return true
        }

        const businessContact = String(data.businessContact || '').trim()
        if (!businessContact) {
            return true
        }

        return /^\d+$/.test(businessContact)
    }, {
        message: 'Business contact must contain numbers only',
        path: ['businessContact']
    }).superRefine((data, ctx) => {
        if (data.accountType !== 'BUSINESS') {
            return
        }

        const requiredBusinessFields = [
            ['businessName', 'Business name is required'],
            ['businessDescription', 'Business description is required'],
            ['businessAddress', 'Business address is required'],
            ['businessContact', 'Business contact is required'],
            ['businessCategory', 'Business category is required']
        ]

        for (const [field, message] of requiredBusinessFields) {
            if (!String(data[field] || '').trim()) {
                ctx.addIssue({ code: 'custom', message, path: [field] })
            }
        }
    })
})

export const loginSchema = zod.object({
    body: zod.object({
        email: zod.string().email('Invalid email').transform((value) => value.trim().toLowerCase()),
        password: zod.string().min(1, 'Password is required')
    })
})

export const sendOrResetOrMailCheckerVerificationCodeSchema = zod.object({
    body: zod.object({
        email: zod.string().email('Invalid email').transform((value) => value.trim().toLowerCase())
    })
})

export const resendVerificationCodeSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required')
    })
})

export const verifyCodeSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required'),
        code: zod.string().min(1, 'Code is required')
    })
})

export const resetPasswordSchema = zod.object({
    body: zod.object({
        token: zod.string().min(1, 'Token is required'),
        password: zod.string().min(1, 'Password is required'),
        confirmPassword: zod.string().min(1, 'Confirm password is required')
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

