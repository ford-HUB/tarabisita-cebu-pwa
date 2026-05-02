import { z } from 'zod'

export const businessProfileSchema = z.object({
  ownerName: z.string().trim().min(2, 'Owner name is required.'),
  businessName: z.string().trim().min(2, 'Business name is required.'),
  address: z.string().trim().min(5, 'Address is required (minimum 5 characters).'),
  phone: z.string().trim().min(7, 'Phone number is required.'),
  website: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Website must be a valid URL.')
    .optional()
    .default(''),
  about: z.string().trim().min(10, 'About section is required (minimum 10 characters).')
})

/** Business dashboard “change password” modal — aligned with server `changeBusinessPasswordSchema`. */
export const businessChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password and confirm password do not match',
        path: ['confirmPassword']
      })
    }
  })
