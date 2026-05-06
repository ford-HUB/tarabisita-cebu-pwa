import zod from 'zod'
import { BUSINESS_CATEGORIES } from '../../shared/constants/businessCategories.js'

const businessCategoryEnum = zod.enum(BUSINESS_CATEGORIES)

export const registerSchema = zod.object({
    body: zod.object({
        name: zod.string().min(1, 'Name is required'),
        email: zod.string().email('Invalid email'),
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
    })
})

export const loginSchema = zod.object({
    body: zod.object({
        email: zod.string().email('Invalid email'),
        password: zod.string().min(1, 'Password is required')
    })
})

export const sendOrResetOrMailCheckerVerificationCodeSchema = zod.object({
    body: zod.object({
        email: zod.string().email('Invalid email')
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

