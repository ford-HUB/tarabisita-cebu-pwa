import zod from 'zod'

const mongoIdParam = zod.object({
    orderId: zod
        .string()
        .regex(/^[a-fA-F0-9]{24}$/, 'Invalid order id')
})

export const advanceCustomerOrderSchema = zod.object({
    params: mongoIdParam
})

export const cancelCustomerOrderSchema = zod.object({
    params: mongoIdParam,
    body: zod.object({
        cancelReason: zod.string().max(2000).optional().default('')
    })
})
