import zod from 'zod'

export const registerPaymongoWebhookSchema = zod.object({
    body: zod.object({
        callbackUrl: zod.string().url('Callback URL must be a valid URL').optional(),
        events: zod.array(zod.string().min(1)).min(1).optional()
    })
})
