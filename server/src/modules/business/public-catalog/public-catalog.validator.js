import zod from 'zod'

const billingTypeEnum = zod.enum([
    'PAY_AT_PICKUP',
    'PREPAID_ONLINE',
    'GCASH',
    'MAYA',
    'GRAB_PAY',
    'BANK_TRANSFER',
    'CARD'
])
const orderTypeEnum = zod.enum(['MENU_ORDER', 'BOOKING_REQUEST'])

const touristCheckoutBillingEnum = zod.enum(['GCASH', 'MAYA', 'CARD', 'GRAB_PAY'])

export const createTouristCustomerOrderSchema = zod.object({
    params: zod.object({
        businessId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid business id')
    }),
    body: zod.object({
        customerName: zod.string().trim().min(2).max(120),
        customerPhone: zod.string().trim().max(40).optional().default(''),
        billingType: billingTypeEnum.optional().default('PAY_AT_PICKUP'),
        orderType: orderTypeEnum.optional().default('MENU_ORDER'),
        notes: zod.string().trim().max(2000).optional().default(''),
        lines: zod
            .array(
                zod.object({
                    menuItemId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid menu item id'),
                    quantity: zod.coerce.number().int().min(1).max(99),
                    notes: zod.preprocess(
                        (v) => (v == null ? '' : String(v).trim().slice(0, 500)),
                        zod.string().max(500)
                    ).optional().default('')
                })
            )
            .min(1)
            .max(50)
    })
})

export const createTouristCustomerOrderCheckoutSchema = zod.object({
    params: zod.object({
        businessId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid business id')
    }),
    body: zod.object({
        customerName: zod.string().trim().min(2).max(120),
        customerPhone: zod.string().trim().max(40).optional().default(''),
        billingType: touristCheckoutBillingEnum.default('GCASH'),
        notes: zod.string().trim().max(2000).optional().default(''),
        lines: zod
            .array(
                zod.object({
                    menuItemId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid menu item id'),
                    quantity: zod.coerce.number().int().min(1).max(99),
                    notes: zod.preprocess(
                        (v) => (v == null ? '' : String(v).trim().slice(0, 500)),
                        zod.string().max(500)
                    ).optional().default('')
                })
            )
            .min(1)
            .max(50),
        returnBaseUrl: zod.preprocess(
            (v) => (v === '' || v == null ? undefined : v),
            zod.string().trim().url().optional()
        )
    })
})

export const touristCatalogSearchRankSchema = zod.object({
    body: zod.object({
        query: zod.string().trim().min(1).max(220),
        items: zod
            .array(
                zod.object({
                    name: zod.string().max(160).optional().default(''),
                    category: zod.string().max(100).optional().default(''),
                    businessName: zod.string().max(120).optional().default('')
                })
            )
            .min(1)
            .max(100)
    })
})

export const listPublicRestaurantReviewsSchema = zod.object({
    params: zod.object({
        businessId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid business id')
    }),
    query: zod.object({
        sort: zod.enum(['newest', 'highest', 'lowest']).optional().default('newest'),
        rating: zod.coerce.number().int().min(1).max(5).optional(),
        page: zod.coerce.number().int().min(1).optional().default(1),
        limit: zod.coerce.number().int().min(1).max(50).optional().default(20)
    })
})

export const listPublicLandingRestaurantReviewsSchema = zod.object({
    query: zod.object({
        limit: zod.coerce.number().int().min(1).max(24).optional().default(12)
    })
})
