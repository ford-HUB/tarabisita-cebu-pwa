import mongoose from 'mongoose'

const mayaWebhookEventSchema = new mongoose.Schema({
    dedupeKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventName: {
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
    }
})

const MayaWebhookEvent = mongoose.model('MayaWebhookEvent', mayaWebhookEventSchema)

export default MayaWebhookEvent
