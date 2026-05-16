import zod from 'zod'

const mongoId = zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id')

export const adminPlanSubscriptionTransactionsQuerySchema = zod.object({
    query: zod
        .object({
            days: zod.enum(['7', '30', '90', 'all']).optional(),
            status: zod.enum(['ALL', 'PENDING', 'PAID', 'CANCELLED']).optional()
        })
        .transform((q) => ({
            days: q.days ?? '7',
            status: q.status ?? 'ALL'
        }))
})

export const adminPlanSubscriptionPaymentIdParamsSchema = zod.object({
    params: zod.object({
        paymentId: mongoId
    })
})

