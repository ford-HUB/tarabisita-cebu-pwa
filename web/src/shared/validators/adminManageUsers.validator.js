import { z } from 'zod'

export const adminManageUsersFilterSchema = z.object({
  search: z.string().max(200, { message: 'Search must be at most 200 characters.' }),
  role: z.enum(['ALL', 'TOURIST', 'BUSINESS', 'ADMIN']),
  whitelisted: z.enum(['ALL', 'true', 'false'])
})
