import mongoose from 'mongoose'

const { Schema } = mongoose

/** Singleton document: platform subscription marketing catalog (mirrors web billing catalog shape). */
const manageSubscriptionSchema = new Schema(
    {
        key: { type: String, unique: true, default: 'default', index: true },
        pricing: { type: [Schema.Types.Mixed], default: [] },
        benefits: { type: [Schema.Types.Mixed], default: [] },
        columns: { type: [Schema.Types.Mixed], default: [] },
        rows: { type: [Schema.Types.Mixed], default: [] },
        freeTier: { type: [Schema.Types.Mixed], default: [] }
    },
    { timestamps: true }
)

/** Mongoose model name kept for existing `subscriptioncatalogs` collection. */
export default mongoose.model('SubscriptionCatalog', manageSubscriptionSchema)
