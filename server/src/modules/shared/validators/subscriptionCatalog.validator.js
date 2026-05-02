import zod from 'zod'

const pricingItemSchema = zod.object({
    id: zod.string().min(1),
    months: zod.coerce.number().int().positive(),
    title: zod.string().min(1),
    description: zod.string(),
    monthlyRate: zod.string(),
    billedAs: zod.string(),
    total: zod.string(),
    totalAmount: zod.coerce.number().positive(),
    highlighted: zod.boolean().optional()
})

const benefitSchema = zod.object({
    label: zod.string().min(1),
    included: zod.boolean()
})

const columnSchema = zod.object({
    key: zod.string().min(1),
    title: zod.string().min(1),
    subtitle: zod.string(),
    highlighted: zod.boolean().optional()
})

const rowSchema = zod.object({
    label: zod.string().min(1),
    values: zod.record(zod.string(), zod.string())
})

const freeTierPairSchema = zod.tuple([zod.string(), zod.string()])

const subscriptionCatalogBodySchema = zod
    .object({
        pricing: zod.array(pricingItemSchema).min(1),
        benefits: zod.array(benefitSchema).min(1),
        columns: zod.array(columnSchema).min(1),
        rows: zod.array(rowSchema).min(1),
        freeTier: zod.array(freeTierPairSchema).min(1)
    })
    .refine(
        (body) => {
            const monthsSet = new Set(body.pricing.map((p) => Number(p.months)))
            return [3, 6, 12].every((m) => monthsSet.has(m))
        },
        { message: 'Pricing must include plans for 3, 6, and 12 months (PayMongo checkout).', path: ['pricing'] }
    )
    .refine(
        (body) => {
            const keys = body.columns.map((c) => c.key)
            return body.rows.every((row) => keys.every((k) => row.values[k] !== undefined))
        },
        { message: 'Each feature row must include a cell for every compare column key.', path: ['rows'] }
    )

export const subscriptionCatalogPutSchema = zod.object({
    body: subscriptionCatalogBodySchema
})
