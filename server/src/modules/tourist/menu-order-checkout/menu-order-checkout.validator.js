import zod from 'zod'

export const menuOrderCheckoutPendingParamsSchema = zod.object({
    params: zod.object({
        pendingId: zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid pending checkout id')
    })
})
