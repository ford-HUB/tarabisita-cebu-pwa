import { z } from 'zod'

/** PayMongo prepay checkout: one wallet/card type per session. */
export const touristCheckoutBillingEnum = z.enum(['GCASH', 'MAYA', 'CARD', 'GRAB_PAY'])

export const touristCheckoutFormSchema = z.object({
  customerName: z.string().trim().min(2, 'Name is required').max(120),
  customerPhone: z.string().trim().max(40).optional().default(''),
  billingType: touristCheckoutBillingEnum,
  notes: z.string().max(2000).optional().default('')
})
