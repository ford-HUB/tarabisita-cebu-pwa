import { z } from 'zod'
import { BUSINESS_CATEGORIES } from '../constants/businessCategories.constants'

const businessCategoryValues = BUSINESS_CATEGORIES.map((item) => item.value)

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  accountType: z.enum(['TOURIST', 'BUSINESS']),
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
  businessAddress: z.string().optional(),
  businessContact: z.string().optional(),
  businessCategory: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
})

export const verificationCodeSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain numbers only'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(1, 'New password is required'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const registerSchema = baseSchema.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  }

  if (data.accountType === 'BUSINESS') {
    const requiredBusinessFields = [
      'businessName',
      'businessDescription',
      'businessAddress',
      'businessContact',
      'businessCategory',
    ]

    requiredBusinessFields.forEach((field) => {
      if (!data[field]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            field === 'businessName'
              ? 'Business name is required'
              : field === 'businessDescription'
                ? 'Business description is required'
                : field === 'businessAddress'
                  ? 'Business address is required'
                  : field === 'businessContact'
                    ? 'Business contact is required'
                    : 'Business category is required',
          path: [field],
        })
      }
    })

    if (data.businessCategory && !businessCategoryValues.includes(data.businessCategory)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a valid business category',
        path: ['businessCategory'],
      })
    }
  }
})