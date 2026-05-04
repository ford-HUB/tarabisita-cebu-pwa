import mongoose from 'mongoose'

const lineSnapshotSchema = new mongoose.Schema(
    {
        menuItemId: { type: String, required: true },
        name: { type: String, required: true },
        unit: { type: Number, required: true },
        qty: { type: Number, required: true },
        lineNotes: { type: String, default: '' },
        image: { type: String, default: '' }
    },
    { _id: false }
)

/**
 * Pay-first tourist menu order: PayMongo checkout is created first; CustomerOrder is inserted after payment (webhook).
 */
const touristMenuOrderCheckoutSchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'FAILED'],
            default: 'AWAITING_PAYMENT',
            index: true
        },
        checkoutSessionId: { type: String, default: '', index: true },
        requestReferenceNumber: { type: String, default: '', index: true },
        customerName: { type: String, required: true, trim: true },
        customerPhone: { type: String, default: '', trim: true },
        billingType: {
            type: String,
            enum: ['PREPAID_ONLINE', 'PAY_AT_PICKUP', 'GCASH', 'MAYA', 'GRAB_PAY', 'BANK_TRANSFER', 'CARD'],
            default: 'PREPAID_ONLINE'
        },
        notes: { type: String, default: '', maxlength: 2000 },
        /** Cart lines at checkout creation (prices locked for fulfillment). */
        resolvedSnapshot: {
            lines: { type: [lineSnapshotSchema], default: [] },
            totalAmount: { type: Number, required: true },
            itemsCount: { type: Number, required: true },
            productName: { type: String, default: '' },
            productDetails: { type: String, default: '' }
        },
        customerOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomerOrder',
            default: null
        }
    },
    { timestamps: true, collection: 'touristmenuordercheckouts' }
)

touristMenuOrderCheckoutSchema.index({ userId: 1, createdAt: -1 })

const TouristMenuOrderCheckout = mongoose.model('TouristMenuOrderCheckout', touristMenuOrderCheckoutSchema)

export default TouristMenuOrderCheckout
