import zod from 'zod'

export const createBusinessBillingCheckoutSchema = zod.object({
    body: zod.object({
        months: zod.number().int().refine((value) => [3, 6, 12].includes(value), {
            message: 'Billing duration must be 3, 6, or 12 months'
        }),
        returnBaseUrl: zod.string().url('Return URL must be a valid URL').optional()
    })
})
