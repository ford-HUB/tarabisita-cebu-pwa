import zod from 'zod'

const objectIdString = zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id')

const detailField = zod.preprocess(
  (v) => (v == null ? '' : String(v).trim().slice(0, 2000)),
  zod.string().max(2000)
)

const cartItemBodySchema = zod.object({
  businessId: objectIdString,
  businessName: zod.string().trim().min(1).max(160),
  catalogItemId: objectIdString,
  name: zod.string().trim().min(1).max(200),
  unitPrice: zod.coerce.number().finite().min(0).max(9_999_999),
  image: zod.string().max(4000).optional().default(''),
  qty: zod.coerce.number().int().min(1).max(99),
  description: detailField.optional().default(''),
  category: detailField.optional().default(''),
  flavor: detailField.optional().default(''),
  preparationTime: detailField.optional().default(''),
  servingSize: detailField.optional().default(''),
  spiceLevel: detailField.optional().default(''),
  allergens: detailField.optional().default(''),
  itemNotes: zod.preprocess(
    (v) => (v == null ? '' : String(v).slice(0, 500)),
    zod.string().max(500)
  ).optional().default('')
})

export const putTouristCartItemSchema = zod.object({
  body: zod
    .object({
      items: zod.array(cartItemBodySchema).max(80),
      deselectedItemKeys: zod.record(zod.string(), zod.boolean()).optional().default({})
    })
    .superRefine((data, ctx) => {
      const seen = new Set()
      for (let i = 0; i < data.items.length; i += 1) {
        const k = `${data.items[i].businessId}:${data.items[i].catalogItemId}`
        if (seen.has(k)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Duplicate cart item',
            path: ['items', i]
          })
          return
        }
        seen.add(k)
      }
    })
})
