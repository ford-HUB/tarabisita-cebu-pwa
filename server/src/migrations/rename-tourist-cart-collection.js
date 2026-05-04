import 'dotenv/config'
import mongoose from 'mongoose'

import { dbConnection } from '../configs/db.config.js'

/** Legacy Mongo collection name from early cart prototypes (before `touristcarts`). */
const LEGACY_COLLECTION = 'touristrestaurantcarts'
const TARGET_COLLECTION = 'touristcarts'

/**
 * Renames MongoDB collection from legacy `touristrestaurantcarts` → `touristcarts`
 * to match the tourist user cart schema (`collection: 'touristcarts'`; see `tourist-cart-item` module).
 *
 * Document shape uses `items` + `catalogItemId` + `deselectedItemKeys` (see `tourist-cart-item` module).
 * Older docs with `lines` / `menuItemId` / `deselectedLineKeys` are still read by the service until rewritten on next PUT.
 *
 * Run from `server/`: `pnpm run migrate:tourist-cart-collection`
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

    const legacyActual = [...names].find(
        (n) => n === LEGACY_COLLECTION || /^touristrestaurantcart/i.test(n)
    )

    if (!legacyActual) {
        console.log(`Migration OK: no legacy tourist cart collection (e.g. ${LEGACY_COLLECTION}).`)
        await mongoose.disconnect()
        return
    }

    if (names.has(TARGET_COLLECTION)) {
        const legacyCount = await db.collection(legacyActual).countDocuments()
        const targetCount = await db.collection(TARGET_COLLECTION).countDocuments()
        if (legacyCount > 0 && targetCount > 0) {
            console.error(
                `Both "${legacyActual}" and "${TARGET_COLLECTION}" have data. Resolve manually before re-running.`
            )
            await mongoose.disconnect().catch(() => {})
            process.exit(1)
        }
        if (legacyCount > 0 && targetCount === 0) {
            await db.collection(TARGET_COLLECTION).drop().catch(() => {})
            await db.collection(legacyActual).rename(TARGET_COLLECTION)
            console.log(`Renamed ${legacyActual} → ${TARGET_COLLECTION} (replaced empty target).`)
        } else {
            await db.collection(legacyActual).drop()
            console.log(`Dropped empty legacy ${legacyActual}; ${TARGET_COLLECTION} already in use.`)
        }
        await mongoose.disconnect()
        return
    }

    if (legacyActual !== LEGACY_COLLECTION) {
        console.log(`Using legacy collection name: ${legacyActual}`)
    }
    await db.collection(legacyActual).rename(TARGET_COLLECTION)
    console.log(`Renamed collection ${legacyActual} → ${TARGET_COLLECTION}.`)
    await mongoose.disconnect()
}

run().catch(async (err) => {
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
})
