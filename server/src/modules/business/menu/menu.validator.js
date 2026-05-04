import zod from 'zod'

export const createBusinessMenuItemSchema = zod.object({
    body: zod.object({
        name: zod.string().min(2, 'Menu name is required'),
        description: zod.string().min(10, 'Description is required'),
        flavor: zod.string().min(2, 'Flavor profile is required'),
        price: zod.number().positive('Price must be greater than zero'),
        category: zod.string().optional().default(''),
        preparationTime: zod.string().optional().default(''),
        servingSize: zod.string().optional().default(''),
        spiceLevel: zod.string().min(1, 'Spice level is required').default('No Spice'),
        allergens: zod.string().optional().default(''),
        isAvailable: zod.boolean().default(true),
        images: zod.array(
            zod.string().refine((value) => value.startsWith('data:image/'), 'Invalid menu image format')
        ).min(2, 'At least 2 menu images are required').max(6, 'A maximum of 6 menu images is allowed')
    })
})

export const deleteBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    })
})

export const updateBusinessMenuItemStockSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    }),
    body: zod.object({
        stockStatus: zod.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK'])
    })
})

export const restoreBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    })
})

export const updateBusinessMenuItemSchema = zod.object({
    params: zod.object({
        menuItemId: zod.string().min(1, 'Menu item id is required')
    }),
    body: zod.object({
        name: zod.string().min(2, 'Menu name is required'),
        description: zod.string().min(10, 'Description is required'),
        flavor: zod.string().min(2, 'Flavor profile is required'),
        price: zod.number().positive('Price must be greater than zero'),
        category: zod.string().optional().default(''),
        preparationTime: zod.string().optional().default(''),
        servingSize: zod.string().optional().default(''),
        spiceLevel: zod.string().min(1, 'Spice level is required').default('No Spice'),
        allergens: zod.string().optional().default(''),
        stockStatus: zod.enum(['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK']).default('AVAILABLE_TO_ORDER'),
        imageReplacements: zod.array(
            zod.object({
                index: zod.number().int().min(0, 'Image index must be zero or greater'),
                image: zod.string().refine((value) => value.startsWith('data:image/'), 'Invalid menu image format')
            })
        ).optional().default([])
    })
})
