import { z } from 'zod'

export const storeMessagingLinkBodySchema = z.object({
    body: z.object({
        businessId: z.string().min(1),
        /** Omit for restaurant/resort/hotel inquiry from a public listing (no order yet). */
        customerOrderId: z.string().min(1).optional()
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
