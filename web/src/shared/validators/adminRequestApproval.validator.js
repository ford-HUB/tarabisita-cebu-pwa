import { z } from 'zod'

export const adminApprovalActionNotesSchema = z.object({
  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters.')
    .transform((value) => String(value ?? '').trim())
})
