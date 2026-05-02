import { z } from 'zod'

export const recordsFilterSchema = z
  .object({
    search: z.string().optional().default(''),
    status: z.enum(['ALL', 'SUCCESS', 'CANCELLED']).default('ALL'),
    startDate: z.string().optional().default(''),
    endDate: z.string().optional().default('')
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be earlier than or equal to end date.',
        path: ['endDate']
      })
    }
  })
