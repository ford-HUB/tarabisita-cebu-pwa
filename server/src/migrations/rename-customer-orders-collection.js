import 'dotenv/config'
import mongoose from 'mongoose'

import { dbConnection } from '../configs/db.config.js'

/**
 * One-time: renames MongoDB collection `restaurantorders` → `customerorders`
 * to match `CustomerOrder` schema (`collection: 'customerorders'`).
 *
 * Safe to run multiple times: no-op if legacy collection is already gone.
 * Run after deploy: `pnpm run migrate:customer-orders-collection` (from server/).
 */
const run = async () => {
    await dbConnection()
    if (mongoose.connection.readyState !== 1) {
        console.error('Database not connected. Set DATABASE_URL and retry.')
        process.exit(1)
    }

    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    const names = new Set(collections.map((c) => c.name))

    const hasLegacy = names.has('restaurantorders')
    const hasTarget = names.has('customerorders')

    if (!hasLegacy) {
        console.log('Migration OK: no legacy collection "restaurantorders" (already migrated or new DB).')
        await mongoose.disconnect()
        return
    }

    if (hasTarget) {
        const legacyCount = await db.collection('restaurantorders').countDocuments()
        const targetCount = await db.collection('customerorders').countDocuments()
        if (legacyCount > 0 && targetCount > 0) {
            console.error(
                'Both "restaurantorders" and "customerorders" exist with data. Resolve manually before re-running.'
            )
            await mongoose.disconnect().catch(() => {})
            process.exit(1)
        }
        if (legacyCount > 0 && targetCount === 0) {
            await db.collection('customerorders').drop().catch(() => {})
            await db.collection('restaurantorders').rename('customerorders')
            console.log('Renamed restaurantorders → customerorders (replaced empty target).')
        } else {
            await db.collection('restaurantorders').drop()
            console.log('Dropped empty legacy restaurantorders; customerorders already in use.')
        }
        await mongoose.disconnect()
        return
    }

    await db.collection('restaurantorders').rename('customerorders')
    console.log('Renamed collection restaurantorders → customerorders.')
    await mongoose.disconnect()
}

run().catch(async (err) => {
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
})
