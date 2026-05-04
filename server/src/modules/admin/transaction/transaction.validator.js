import zod from 'zod'

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
