import mongoose from 'mongoose'

const paymongoWebhookEventSchema = new mongoose.Schema({
    dedupeKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventId: {
        type: String,
        default: ''
    },
    eventType: {
        type: String,
        default: ''
    },
    paymentId: {
        type: String,
        default: ''
    },
    requestReferenceNumber: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: ''
    },
    payload: {
        type: Object,
        default: {}
    },
    processedAt: {
        type: Date,
        default: Date.now
    },
    /** When true, payload has been applied to Business / Payment / Subscription (or skipped as terminal). */
    businessLedgerSynced: {
        type: Boolean,
        default: false,
        index: true
    },
    businessLedgerSyncedAt: {
        type: Date,
        default: null
    },
    businessLedgerSyncError: {
        type: String,
        default: ''
    }
})

const PaymongoWebhookEvent = mongoose.model('PaymongoWebhookEvent', paymongoWebhookEventSchema)

export default PaymongoWebhookEvent
