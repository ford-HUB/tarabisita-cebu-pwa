import mongoose from 'mongoose'

const { Schema } = mongoose

/** Singleton document: platform subscription marketing catalog (mirrors web billing catalog shape). */
const subscriptionCatalogSchema = new Schema(
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

export default mongoose.model('SubscriptionCatalog', subscriptionCatalogSchema)
