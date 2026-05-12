import zod from 'zod'

const sentimentFilter = zod.enum(['all', 'good', 'bad']).optional().default('all')

export const listMyCustomerRatingsSchema = zod.object({
    query: zod.object({
        page: zod.coerce.number().int().min(1).optional().default(1),
        limit: zod.coerce.number().int().min(1).max(50).optional().default(20),
        sentiment: sentimentFilter
    })
})
