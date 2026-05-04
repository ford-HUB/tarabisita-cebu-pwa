import zod from 'zod'

const mongoId = zod.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user id')

export const adminUsersListQuerySchema = zod.object({
  query: zod.object({
    search: zod.string().max(200).optional().default(''),
    role: zod.enum(['ALL', 'TOURIST', 'BUSINESS', 'ADMIN']).optional().default('ALL'),
    whitelisted: zod.enum(['ALL', 'true', 'false']).optional().default('ALL'),
    page: zod.coerce.number().int().min(1).optional().default(1),
    limit: zod.coerce.number().int().min(1).max(100).optional().default(15)
  })
})

export const adminUserIdParamsSchema = zod.object({
  params: zod.object({
    userId: mongoId
  })
})

export const adminUserWhitelistBodySchema = zod.object({
  params: zod.object({
    userId: mongoId
  }),
  body: zod.object({
    whitelisted: zod.boolean()
  })
})

/** Multipart text fields (after multer). */
export const adminUserWarningEmailSchema = zod.object({
  params: zod.object({
    userId: mongoId
  }),
  body: zod.object({
    subject: zod.string().trim().min(1, 'Subject is required').max(200),
    message: zod.string().trim().min(1, 'Message is required').max(50000)
  })
})
