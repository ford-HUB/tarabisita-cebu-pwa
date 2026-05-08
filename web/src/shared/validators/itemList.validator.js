import { z } from 'zod'

export const editItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  flavor: z.string().min(2, 'Type/profile is required.'),
  price: z.coerce.number().positive('Price must be greater than zero.'),
  category: z.string().optional().default(''),
  preparationTime: z.string().optional().default(''),
  servingSize: z.string().optional().default(''),
  spiceLevel: z.string().min(1, 'Spice level is required.'),
  allergens: z.string().optional().default(''),
  addOns: z
    .array(
      z.object({
        id: z.string().optional().default(''),
        name: z.string().min(1, 'Add-on name is required'),
        price: z.coerce.number().min(0, 'Add-on price cannot be negative')
      })
    )
    .optional()
    .default([]),
  stockStatus: z.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK'])
})
