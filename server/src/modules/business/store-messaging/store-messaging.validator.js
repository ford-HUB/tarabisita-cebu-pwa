import { z } from 'zod'

export const businessStoreMessagingThreadQuerySchema = z.object({
    query: z.object({
        conversationId: z.string().min(1)
    })
})
