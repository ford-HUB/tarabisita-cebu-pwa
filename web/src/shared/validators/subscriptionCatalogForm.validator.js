import { z } from 'zod'

/** Mirrors server `manageSubscriptionBodySchema` for admin catalog form (RHF + zodResolver). */
const pricingItemSchema = z.object({
  id: z.string().min(1),
  months: z.coerce.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  monthlyRate: z.string(),
  billedAs: z.string(),
  total: z.string(),
  totalAmount: z.coerce.number().positive(),
  highlighted: z.boolean().optional()
})

const benefitSchema = z.object({
  label: z.string().min(1),
  included: z.boolean()
})

const columnSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string(),
  highlighted: z.boolean().optional()
})

const rowSchema = z.object({
  label: z.string().min(1),
  values: z.record(z.string(), z.string())
})

const freeTierPairSchema = z.tuple([z.string(), z.string()])

export const subscriptionCatalogFormSchema = z
  .object({
    pricing: z.array(pricingItemSchema).min(1),
    benefits: z.array(benefitSchema).min(1),
    columns: z.array(columnSchema).min(1),
    rows: z.array(rowSchema).min(1),
    freeTier: z.array(freeTierPairSchema).min(1)
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
