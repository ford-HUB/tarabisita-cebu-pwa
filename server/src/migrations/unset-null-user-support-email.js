import 'dotenv/config'
import mongoose from 'mongoose'

import { dbConnection } from '../configs/db.config.js'

/**
 * One-time: removes explicit `supportEmail: null` so the sparse unique index
 * only applies to documents that actually have a support email.
 *
 * Safe to run multiple times.
 * Run from `server/`: `pnpm run migrate:unset-null-user-support-email`
 */
const run = async () => {
    await dbConnection()
    if (mongoose.connection.readyState !== 1) {
        console.error('Database not connected. Set DATABASE_URL and retry.')
        process.exit(1)
    }

    const db = mongoose.connection.db
    const users = db.collection('users')
    const result = await users.updateMany(
        { $or: [{ supportEmail: null }, { supportEmail: '' }] },
        { $unset: { supportEmail: '' } }
    )

    console.log(
        `Migration complete. matched=${result.matchedCount}, modified=${result.modifiedCount}.`
    )

    await mongoose.disconnect()
}

run().catch(async (err) => {
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
})
