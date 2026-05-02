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

export const updateBusinessThemeColorSchema = zod.object({
    body: zod.object({
        themeColor: zod
            .string()
            .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Theme color must be a valid hex color')
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

export const createBusinessMenuItemSchema = zod.object({
    body: zod.object({
        name: zod.string().min(2, 'Menu name is required'),
        description: zod.string().min(10, 'Description is required'),
        flavor: zod.string().min(2, 'Flavor profile is required'),
        price: zod.number().positive('Price must be greater than zero'),
        category: zod.string().optional().default(''),
        preparationTime: zod.string().optional().default(''),
        servingSize: zod.string().optional().default(''),
        spiceLevel: zod.string().min(1, 'Spice level is required').default('No Spice'),
        allergens: zod.string().optional().default(''),
        isAvailable: zod.boolean().default(true),
        images: zod.array(
            zod.string().refine((value) => value.startsWith('data:image/'), 'Invalid menu image format')
        ).min(2, 'At least 2 menu images are required').max(6, 'A maximum of 6 menu images is allowed')
    })
})

export const deleteBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    })
})

export const updateBusinessMenuItemStockSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    }),
    body: zod.object({
        stockStatus: zod.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK'])
    })
})

export const restoreBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    })
})

export const updateBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    }),
    body: zod.object({
        name: zod.string().min(2, 'Menu name is required'),
        description: zod.string().min(10, 'Description is required'),
        flavor: zod.string().min(2, 'Flavor profile is required'),
        price: zod.number().positive('Price must be greater than zero'),
        category: zod.string().optional().default(''),
        preparationTime: zod.string().optional().default(''),
        servingSize: zod.string().optional().default(''),
        spiceLevel: zod.string().min(1, 'Spice level is required').default('No Spice'),
        allergens: zod.string().optional().default(''),
        stockStatus: zod.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK']).default('AVAILABLE_TO_ORDER'),
        imageReplacements: zod.array(
            zod.object({
                index: zod.number().int().min(0, 'Image index must be zero or greater'),
                image: zod.string().refine((value) => value.startsWith('data:image/'), 'Invalid menu image format')
            })
        ).optional().default([])
    })
})

export const createBusinessBillingCheckoutSchema = zod.object({
    body: zod.object({
        months: zod.number().int().refine((value) => [3, 6, 12].includes(value), {
            message: 'Billing duration must be 3, 6, or 12 months'
        }),
        returnBaseUrl: zod.string().url('Return URL must be a valid URL').optional()
    })
})

export const registerPaymongoWebhookSchema = zod.object({
    body: zod.object({
        callbackUrl: zod.string().url('Callback URL must be a valid URL').optional(),
        events: zod.array(zod.string().min(1)).min(1).optional()
    })
})

export const adminPlanSubscriptionTransactionsQuerySchema = zod.object({
    query: zod
        .object({
            days: zod.enum(['7', '30', '90', 'all']).optional(),
            status: zod.enum(['ALL', 'PENDING', 'PAID', 'FAILED', 'CANCELLED']).optional()
        })
        .transform((q) => ({
            days: q.days ?? '7',
            status: q.status ?? 'ALL'
        }))
})

