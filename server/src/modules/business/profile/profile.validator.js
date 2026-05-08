import zod from 'zod'

export const updateBusinessSettingsSchema = zod.object({
    body: zod.object({
        receiveOrderEmailAlerts: zod.boolean(),
        receiveChatNotifications: zod.boolean(),
        autoAcceptOrders: zod.boolean(),
        prepTimeMinutes: zod.number().int().min(5).max(120),
        lowStockThreshold: zod.number().int().min(1).max(500),
        paymentMethods: zod.object({
            GCASH: zod.object({
                enabled: zod.boolean(),
                accountName: zod.string().max(120).optional().default(''),
                accountNumber: zod.string().max(120).optional().default(''),
                instructions: zod.string().max(500).optional().default(''),
                isVerified: zod.boolean().optional().default(false),
                verifiedAt: zod.union([zod.string(), zod.date()]).optional().nullable()
            }),
            MAYA: zod.object({
                enabled: zod.boolean(),
                accountName: zod.string().max(120).optional().default(''),
                accountNumber: zod.string().max(120).optional().default(''),
                instructions: zod.string().max(500).optional().default(''),
                isVerified: zod.boolean().optional().default(false),
                verifiedAt: zod.union([zod.string(), zod.date()]).optional().nullable()
            }),
            GRAB_PAY: zod.object({
                enabled: zod.boolean(),
                accountName: zod.string().max(120).optional().default(''),
                accountNumber: zod.string().max(120).optional().default(''),
                instructions: zod.string().max(500).optional().default(''),
                isVerified: zod.boolean().optional().default(false),
                verifiedAt: zod.union([zod.string(), zod.date()]).optional().nullable()
            }),
            CARD: zod.object({
                enabled: zod.boolean(),
                accountName: zod.string().max(120).optional().default(''),
                accountNumber: zod.string().max(120).optional().default(''),
                instructions: zod.string().max(500).optional().default(''),
                isVerified: zod.boolean().optional().default(false),
                verifiedAt: zod.union([zod.string(), zod.date()]).optional().nullable()
            })
        })
    })
})

export const verifyBusinessPaymentMethodSchema = zod.object({
    body: zod.object({
        methodCode: zod.enum(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']),
        accountName: zod.string().trim().min(2).max(120),
        accountNumber: zod.string().trim().min(3).max(120)
    })
})

export const createBusinessPaymentMethodSetupCheckoutSchema = zod.object({
    body: zod.object({
        methodCode: zod.enum(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']),
        returnBaseUrl: zod.string().trim().url().optional().default('')
    })
})

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

export const updateResortListingStockSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Listing id is required')
    }),
    body: zod.object({
        stockStatus: zod.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK'])
    })
})
