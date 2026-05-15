import zod from 'zod'

export const bookingRequestPaymentCheckoutSchema = zod.object({
    params: zod.object({
        orderId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid order id')
    }),
    body: zod
        .object({
            returnBaseUrl: zod.string().optional().default(''),
            paymentMethod: zod.enum(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']).optional().default('GCASH')
        })
        .default({})
})

export const bookingPaymentLinkResolveSchema = zod.object({
    body: zod.object({
        paymentToken: zod.string().min(12, 'Invalid payment token')
    })
})

export const bookingPaymentLinkCheckoutSchema = zod.object({
    body: zod.object({
        paymentToken: zod.string().min(12, 'Invalid payment token'),
        returnBaseUrl: zod.string().optional().default(''),
        paymentMethod: zod.enum(['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']).optional().default('GCASH')
    })
})

export const restaurantOrderReviewParamsSchema = zod.object({
    params: zod.object({
        orderId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid order id')
    })
})

export const restaurantOrderReviewUpsertBodySchema = zod.object({
    params: zod.object({
        orderId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid order id')
    }),
    body: zod.object({
        rating: zod.coerce.number().int().min(1).max(5),
        comment: zod.string().max(2000).optional().default('')
    })
})
