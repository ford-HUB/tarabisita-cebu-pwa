import zod from 'zod'

export const updateTouristProfileSchema = zod.object({
    body: zod
        .object({
            name: zod.string().min(1, 'Name is required').max(120).optional(),
            avatar: zod.union([zod.string().max(2048), zod.literal('')]).optional()
        })
        .refine((data) => data.name !== undefined || data.avatar !== undefined, {
            message: 'Provide at least one field to update',
            path: ['name']
        })
})

export const changeTouristPasswordSchema = zod.object({
    body: zod
        .object({
            currentPassword: zod.string().min(8, 'Current password is required'),
            newPassword: zod.string().min(8, 'New password must be at least 8 characters'),
            confirmPassword: zod.string().min(8, 'Confirm password is required')
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: 'New password and confirm password do not match',
            path: ['confirmPassword']
        })
})

export const requestTouristEmailChangeSchema = zod.object({
    body: zod.object({
        newEmail: zod.string().email('Invalid email')
    })
})

export const confirmTouristEmailChangeSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required'),
        code: zod.string().min(1, 'Verification code is required')
    })
})

export const resendTouristEmailChangeSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required')
    })
})

export const requestTouristSupportEmailVerificationSchema = zod.object({
    body: zod.object({
        supportEmail: zod.string().email('Invalid email')
    })
})

export const confirmTouristSupportEmailVerificationSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required'),
        code: zod.string().min(1, 'Verification code is required')
    })
})

export const resendTouristSupportEmailVerificationSchema = zod.object({
    body: zod.object({
        sessionToken: zod.string().min(1, 'Session token is required')
    })
})

export const clearTouristSupportEmailSchema = zod.object({
    body: zod.object({
        supportEmail: zod.literal('')
    })
})

export const uploadTouristAvatarImageSchema = zod.object({
    body: zod.object({
        avatarImage: zod
            .string()
            .min(1, 'Image is required')
            .refine((value) => value.startsWith('data:image/'), 'Invalid image format')
    })
})
