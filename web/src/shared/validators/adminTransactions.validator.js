import { z } from 'zod'

export const adminTransactionsFilterSchema = z.object({
  search: z.string().max(200, { message: 'Search must be at most 200 characters.' }),
  period: z.enum(['7', '30', '90', 'all']),
  paymentStatus: z.enum(['ALL', 'PENDING', 'PAID', 'CANCELLED'])
})
