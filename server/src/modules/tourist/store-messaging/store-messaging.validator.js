import { z } from 'zod'

export const storeMessagingLinkBodySchema = z.object({
    body: z.object({
        businessId: z.string().min(1),
        customerOrderId: z.string().min(1)
    })
})

export const storeMessagingSessionQuerySchema = z.object({
    query: z.object({
        m: z.string().min(1)
    })
})

export const storeMessagingThreadQuerySchema = z.object({
    query: z.object({
        conversationId: z.string().min(1)
    })
})
