import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
    actorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    actorRole: {
        type: String,
        enum: ['ADMIN', 'BUSINESS', 'TOURIST'],
        required: true
    },
    scopeType: {
        type: String,
        enum: ['USER', 'BUSINESS', 'SYSTEM'],
        default: 'USER'
    },
    scopeId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'ACCOUNT_SECURITY'
    },
    severity: {
        type: String,
        enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'INFO'
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'WARNING'],
        default: 'SUCCESS'
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    device: {
        type: String,
        default: ''
    },
    failureReason: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
})

activityLogSchema.index({ actorUserId: 1, createdAt: -1 })
activityLogSchema.index({ actorRole: 1, createdAt: -1 })
activityLogSchema.index({ scopeType: 1, scopeId: 1, createdAt: -1 })
activityLogSchema.index({ scopeType: 1, scopeId: 1, action: 1, createdAt: -1 })

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
