import mongoose from 'mongoose'

/** What the payment is for (extend as you add products). */
export const PAYMENT_TYPES = {
    BUSINESS_PLAN_SUBSCRIPTION: 'BUSINESS_PLAN_SUBSCRIPTION'
}

const paymentSchema = new mongoose.Schema(
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
        type: {
            type: String,
            enum: Object.values(PAYMENT_TYPES),
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REJECTED'],
            default: 'PENDING',
            index: true
        },
        amount: {
            type: Number,
            required: true
        },
        /** Legacy unique indexes still exist on the collection; keep these populated for new billing rows. */
        orderId: { type: String, default: undefined },
        transactionId: { type: String, default: undefined },
        currency: {
            type: String,
            default: 'PHP',
            uppercase: true
        },
        planId: { type: String, default: '' },
        months: { type: Number, default: null },
        checkoutSessionId: {
            type: String,
            default: '',
            index: true
        },
        xenditPaymentId: {
            type: String,
            default: ''
        },
        requestReferenceNumber: { type: String, default: '' },
        subscriptionRecordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BusinessSubscription',
            default: null
        },
        paidAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        /** Optional bank-transfer / manual proof image URL (absolute or app-relative). */
        proofReceiptUrl: { type: String, default: '' },
        /** Admin decline note (optional). */
        declineReason: { type: String, default: '' },
        adminReviewedAt: { type: Date, default: null },
        adminReviewedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
)

paymentSchema.index({ businessId: 1, createdAt: -1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
