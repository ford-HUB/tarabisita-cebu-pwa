import zod from 'zod'

export const updateAdminProfileSchema = zod
  .object({
    body: zod
      .object({
        name: zod.string().min(1, 'Name is required').max(120),
        currentPassword: zod.string().optional(),
        newPassword: zod.string().min(8, 'New password must be at least 8 characters').optional(),
        confirmPassword: zod.string().optional()
      })
      .superRefine((data, ctx) => {
        const hasNew = Boolean(data.newPassword && String(data.newPassword).trim())
        if (!hasNew) return

        if (!data.currentPassword || !String(data.currentPassword).trim()) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: 'Current password is required to set a new password',
            path: ['currentPassword']
          })
        }
        if (!data.confirmPassword || data.confirmPassword !== data.newPassword) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: 'New password and confirm password do not match',
            path: ['confirmPassword']
          })
        }
      })
  })
