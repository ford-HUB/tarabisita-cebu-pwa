import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import { dbConnection } from '../configs/db.config.js'
import Role from '../modules/auth/models/role.model.js'
import User from '../modules/auth/models/user.model.js'
import { adminCredentials } from './seeders/admin-credentials.js'

const seedAdmin = async () => {
    try {
        await dbConnection()

        const role = await Role.findOneAndUpdate(
            { name: adminCredentials.role.name },
            {
                $set: {
                    description: adminCredentials.role.description,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    name: adminCredentials.role.name,
                    createdAt: new Date(),
                },
            },
            { upsert: true, returnDocument: 'after' }
        )

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(adminCredentials.password, salt)

        const existingAdmin = await User.findOne({ email: adminCredentials.email })
        if (existingAdmin) {
            existingAdmin.name = adminCredentials.name
            existingAdmin.password = hashedPassword
            existingAdmin.roleId = role._id
            existingAdmin.updatedAt = new Date()
            await existingAdmin.save()

            console.log(`Admin updated: ${existingAdmin.email}`)
        } else {
            const admin = await User.create({
                name: adminCredentials.name,
                email: adminCredentials.email,
                password: hashedPassword,
                roleId: role._id,
            })

            console.log(`Admin created: ${admin.email}`)
        }
    } catch (error) {
        console.error('Failed to seed admin:', error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

seedAdmin()
