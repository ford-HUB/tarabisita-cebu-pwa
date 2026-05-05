import 'dotenv/config'
import mongoose from 'mongoose'

import { dbConnection } from '../configs/db.config.js'

/**
 * One-time: removes deprecated `themeColor` field from all `businesses` documents.
 *
 * Safe to run multiple times.
 * Run from `server/`: `pnpm run migrate:remove-business-theme-color`
 */
const run = async () => {
    await dbConnection()
    if (mongoose.connection.readyState !== 1) {
        console.error('Database not connected. Set DATABASE_URL and retry.')
        process.exit(1)
    }

    const db = mongoose.connection.db
    const businesses = db.collection('businesses')
    const result = await businesses.updateMany(
        { themeColor: { $exists: true } },
        { $unset: { themeColor: '' } }
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
