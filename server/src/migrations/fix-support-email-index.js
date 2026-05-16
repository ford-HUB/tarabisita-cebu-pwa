import 'dotenv/config'
import mongoose from 'mongoose'

import { dbConnection } from '../configs/db.config.js'

/**
 * Fixes users.supportEmail unique index so multiple accounts can omit supportEmail.
 * The old non-sparse unique index only allowed one document with supportEmail: null.
 *
 * Run from `server/`: `pnpm run migrate:fix-support-email-index`
 */
const run = async () => {
    await dbConnection()
    if (mongoose.connection.readyState !== 1) {
        console.error('Database not connected. Set DATABASE_URL and retry.')
        process.exit(1)
    }

    const users = mongoose.connection.db.collection('users')

    const indexes = await users.indexes()
    const supportEmailIndex = indexes.find((index) => index.key?.supportEmail === 1)
    if (supportEmailIndex) {
        console.log('Dropping existing supportEmail index:', supportEmailIndex.name)
        await users.dropIndex(supportEmailIndex.name)
    }

    const unsetResult = await users.updateMany(
        { $or: [{ supportEmail: null }, { supportEmail: '' }] },
        { $unset: { supportEmail: '' } }
    )
    console.log(
        `Unset empty supportEmail on users. matched=${unsetResult.matchedCount}, modified=${unsetResult.modifiedCount}`
    )

    await users.createIndex({ supportEmail: 1 }, { unique: true, sparse: true })
    console.log('Created sparse unique index on supportEmail.')

    await mongoose.disconnect()
}

run().catch(async (err) => {
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
})
