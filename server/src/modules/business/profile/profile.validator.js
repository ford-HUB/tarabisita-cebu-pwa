import zod from 'zod'

export const submitBusinessProofSchema = zod.object({
    body: zod.object({
        proofs: zod.array(zod.string().min(1, 'Proof is required')).default([]),
        proofDocuments: zod.array(
            zod.string().refine((value) => value.startsWith('data:image/'), 'Invalid proof document format')
        ).default([]),
        notes: zod.string().optional()
    }).refine((data) => data.proofs.length > 0 || data.proofDocuments.length > 0, {
        message: 'At least one proof link or document is required',
        path: ['proofs']
    })
})

export const updateBusinessProfileSchema = zod.object({
    body: zod.object({
        ownerName: zod.string().min(2, 'Owner name is required'),
        businessName: zod.string().min(2, 'Business name is required'),
        address: zod.string().min(5, 'Address is required'),
        phone: zod.string().min(7, 'Phone number is required'),
        about: zod.string().min(10, 'About section is required'),
        website: zod.string().url('Website must be a valid URL').optional().or(zod.literal('')),
        lat: zod.number(),
        lng: zod.number()
    })
})

export const uploadBusinessProfileImageSchema = zod.object({
    body: zod.object({
        profileImage: zod
            .string()
            .min(1, 'Profile image is required')
            .refine((value) => value.startsWith('data:image/'), 'Invalid profile image format')
    })
})

export const uploadBusinessAvatarImageSchema = zod.object({
    body: zod.object({
        avatarImage: zod
            .string()
            .min(1, 'Avatar image is required')
            .refine((value) => value.startsWith('data:image/'), 'Invalid avatar image format')
    })
})

export const uploadBusinessBannerImageSchema = zod.object({
    body: zod.object({
        bannerImage: zod
            .string()
            .min(1, 'Banner image is required')
            .refine((value) => value.startsWith('data:image/'), 'Invalid banner image format')
    })
})

export const changeBusinessPasswordSchema = zod.object({
    body: zod.object({
        currentPassword: zod.string().min(8, 'Current password is required'),
        newPassword: zod.string().min(8, 'New password must be at least 8 characters'),
        confirmPassword: zod.string().min(8, 'Confirm password is required')
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: 'New password and confirm password do not match',
        path: ['confirmPassword']
    })
})
