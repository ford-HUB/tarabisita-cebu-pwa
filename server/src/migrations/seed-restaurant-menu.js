import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import { dbConnection } from '../configs/db.config.js'
import Role from '../modules/auth/models/role.model.js'
import User from '../modules/auth/models/user.model.js'
import Business from '../modules/business/models/business.model.js'
import { restaurantMenuOwnerCredentials } from './seeders/restaurant-menu-credentials.js'
import {
    restaurantMenuSeedItems,
    restaurantMenuSeedNamePrefix,
} from './seeders/restaurant-menu-items.js'

const MIN_SEEDED_MENU_COUNT = 20

const ensureBusinessRole = async () => {
    const role = await Role.findOneAndUpdate(
        { name: restaurantMenuOwnerCredentials.role.name },
        {
            $set: {
                description: restaurantMenuOwnerCredentials.role.description,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                name: restaurantMenuOwnerCredentials.role.name,
                createdAt: new Date(),
            },
        },
        { upsert: true, returnDocument: 'after' }
    )
    return role
}

const upsertBusinessOwnerUser = async (roleId) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(restaurantMenuOwnerCredentials.password, salt)

    const existing = await User.findOne({ email: restaurantMenuOwnerCredentials.email })
    if (existing) {
        existing.name = restaurantMenuOwnerCredentials.name
        existing.password = hashedPassword
        existing.roleId = roleId
        existing.updatedAt = new Date()
        await existing.save()
        console.log(`Business owner user updated: ${existing.email}`)
        return existing
    }

    const created = await User.create({
        name: restaurantMenuOwnerCredentials.name,
        email: restaurantMenuOwnerCredentials.email,
        password: hashedPassword,
        roleId: roleId,
    })
    console.log(`Business owner user created: ${created.email}`)
    return created
}

const seedRestaurantMenu = async () => {
    try {
        await dbConnection()

        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL is not set. Add it to your environment before running this seed.')
            process.exitCode = 1
            return
        }

        const role = await ensureBusinessRole()
        const user = await upsertBusinessOwnerUser(role._id)

        const business = await Business.findOne({ userId: user._id })
        if (!business) {
            console.error(
                'No Business document found for this user. Create a business profile in the app (or import one) so menuItems can be attached.'
            )
            process.exitCode = 1
            return
        }

        const seededAlready = business.menuItems.filter((m) =>
            String(m.name || '').startsWith(restaurantMenuSeedNamePrefix)
        ).length
        if (seededAlready >= MIN_SEEDED_MENU_COUNT) {
            console.log(
                `Skipped: business "${business.name}" already has ${seededAlready} items with seed prefix "${restaurantMenuSeedNamePrefix}".`
            )
            return
        }

        await Business.updateOne(
            { _id: business._id },
            {
                $push: {
                    menuItems: {
                        $each: restaurantMenuSeedItems,
                        $position: 0,
                    },
                },
                $set: { updatedAt: new Date() },
            }
        )

        console.log(
            `Inserted ${restaurantMenuSeedItems.length} menu items for business "${business.name}" (owner ${user.email}).`
        )
    } catch (error) {
        console.error('Failed to seed restaurant menu:', error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

seedRestaurantMenu()
