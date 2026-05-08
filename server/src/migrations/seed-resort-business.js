import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import { dbConnection } from '../configs/db.config.js'
import Role from '../modules/auth/models/role.model.js'
import User from '../modules/auth/models/user.model.js'
import Business from '../modules/business/models/business.model.js'
import Category from '../modules/business/models/category.model.js'

const RESORT_OWNER = {
    email: 'devehob273@badgerhole.com',
    password: 'crisdyford11',
    name: 'Resort Owner',
}

const RESORT_IMAGE_URLS = {
    banner: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
    logo: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80',
    galleryOne:
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80',
    galleryTwo:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    galleryThree:
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=80',
}

const RESORT_MENU_ITEMS = [
    {
        name: 'Deluxe Ocean View Room',
        description: 'Spacious room with sea-facing balcony, breakfast, and pool access.',
        flavor: 'Room',
        price: 4500,
        category: 'Accommodation',
        preparationTime: 'Daily check-in: 2:00 PM',
        servingSize: 'Good for 2 guests',
        spiceLevel: 'Deluxe',
        allergens: 'WiFi, Aircon, Breakfast',
        isAvailable: true,
        stockStatus: 'AVAILABLE_TO_ORDER',
        isDeleted: false,
        deletedAt: null,
        images: [RESORT_IMAGE_URLS.galleryOne, RESORT_IMAGE_URLS.galleryTwo],
    },
    {
        name: 'Family Garden Villa',
        description: 'Private villa with two bedrooms and direct garden access near the beach.',
        flavor: 'Villa',
        price: 7800,
        category: 'Accommodation',
        preparationTime: 'Daily check-in: 2:00 PM',
        servingSize: 'Good for 4 guests',
        spiceLevel: 'Suite',
        allergens: 'WiFi, Aircon, Kitchenette',
        isAvailable: true,
        stockStatus: 'AVAILABLE_TO_ORDER',
        isDeleted: false,
        deletedAt: null,
        images: [RESORT_IMAGE_URLS.galleryThree, RESORT_IMAGE_URLS.galleryTwo],
    },
]

const ensureBusinessRole = async () => {
    const role = await Role.findOneAndUpdate(
        { name: 'BUSINESS' },
        {
            $set: {
                description: 'This role can access the business side of features.',
                updatedAt: new Date(),
            },
            $setOnInsert: {
                name: 'BUSINESS',
                createdAt: new Date(),
            },
        },
        { upsert: true, returnDocument: 'after' }
    )
    return role
}

const upsertResortOwner = async (roleId) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(RESORT_OWNER.password, salt)
    const existing = await User.findOne({ email: RESORT_OWNER.email })

    if (existing) {
        existing.name = existing.name || RESORT_OWNER.name
        existing.password = hashedPassword
        existing.roleId = roleId
        existing.updatedAt = new Date()
        await existing.save()
        return existing
    }

    const created = await User.create({
        name: RESORT_OWNER.name,
        email: RESORT_OWNER.email,
        password: hashedPassword,
        roleId,
    })
    return created
}

const findOrCreateResortCategory = async () => {
    const existing = await Category.findOne({
        name: { $regex: /^resort$/i },
    })
    if (existing) return existing
    const created = await Category.create({
        name: 'Resort',
        description: 'Resort and accommodation businesses.',
        createdAt: new Date(),
    })
    return created
}

const upsertResortBusiness = async ({ userId, categoryId }) => {
    const existing = await Business.findOne({ userId })
    if (existing) {
        existing.name = existing.name || 'Peaceful Paradise Resort'
        existing.description =
            existing.description ||
            'A relaxing seaside resort with premium rooms, curated packages, and scenic stays.'
        existing.address = existing.address || 'Cebu, Philippines'
        existing.contact_info = existing.contact_info || { phone: '09123456789' }
        existing.logo = RESORT_IMAGE_URLS.logo
        existing.banner = RESORT_IMAGE_URLS.banner
        existing.coverImage = RESORT_IMAGE_URLS.banner
        existing.category = existing.category || categoryId
        existing.menuItems = RESORT_MENU_ITEMS
        existing.updatedAt = new Date()
        await existing.save()
        return existing
    }

    const created = await Business.create({
        userId,
        name: 'Peaceful Paradise Resort',
        description: 'A relaxing seaside resort with premium rooms, curated packages, and scenic stays.',
        address: 'Cebu, Philippines',
        contact_info: { phone: '09123456789' },
        website: '',
        logo: RESORT_IMAGE_URLS.logo,
        coverImage: RESORT_IMAGE_URLS.banner,
        banner: RESORT_IMAGE_URLS.banner,
        socialMedia: {},
        category: categoryId,
        menuItems: RESORT_MENU_ITEMS,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    return created
}

const run = async () => {
    try {
        await dbConnection()
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL is not set. Add it to your environment before running this seed.')
            process.exitCode = 1
            return
        }

        const role = await ensureBusinessRole()
        const owner = await upsertResortOwner(role._id)
        const resortCategory = await findOrCreateResortCategory()
        const business = await upsertResortBusiness({ userId: owner._id, categoryId: resortCategory._id })

        console.log(`Seeded resort account: ${owner.email}`)
        console.log(`Business: ${business.name}`)
        console.log('Images are URL-only (no base64).')
    } catch (error) {
        console.error('Failed to seed resort business data:', error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

run()
