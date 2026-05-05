import mongoose from 'mongoose'

const utcParts = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes()
    }
}

const businessSubscriptionSchema = new mongoose.Schema(
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
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
            default: null
        },
        /** Xendit checkout session/invoice id (set when checkout is created). */
        checkoutSessionId: {
            type: String,
            default: '',
            index: true
        },
        planId: { type: String, required: true },
        months: { type: Number, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'PHP', uppercase: true },
        status: {
            type: String,
            enum: ['PENDING_CHECKOUT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED', 'SUPERSEDED'],
            default: 'PENDING_CHECKOUT',
            index: true
        },
        startedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
        startYear: { type: Number },
        startMonth: { type: Number },
        startDay: { type: Number },
        startHour: { type: Number },
        startMinute: { type: Number },
        endYear: { type: Number },
        endMonth: { type: Number },
        endDay: { type: Number },
        endHour: { type: Number },
        endMinute: { type: Number },
        xenditCheckoutId: { type: String, default: '' },
        requestReferenceNumber: { type: String, default: '' }
    },
    { timestamps: true }
)

businessSubscriptionSchema.index({ businessId: 1, createdAt: -1 })
businessSubscriptionSchema.index({ requestReferenceNumber: 1 })

businessSubscriptionSchema.statics.buildPeriodFields = (startedAt, expiresAt) => {
    const s = utcParts(startedAt)
    const e = utcParts(expiresAt)
    return {
        startYear: s.year,
        startMonth: s.month,
        startDay: s.day,
        startHour: s.hour,
        startMinute: s.minute,
        endYear: e.year,
        endMonth: e.month,
        endDay: e.day,
        endHour: e.hour,
        endMinute: e.minute
    }
}

const BusinessSubscription = mongoose.model('BusinessSubscription', businessSubscriptionSchema)

export default BusinessSubscription
