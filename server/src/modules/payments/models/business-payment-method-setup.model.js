import mongoose from 'mongoose'

const businessPaymentMethodSetupSchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: true,
            index: true
        },
        methodCode: {
            type: String,
            required: true,
            enum: ['GCASH', 'MAYA', 'GRAB_PAY', 'CARD'],
            index: true
        },
        /** Xendit invoice external_id (e.g. TBPMV...). */
        externalId: {
            type: String,
            required: true
        },
        /** Xendit invoice id. */
        checkoutId: {
            type: String,
            default: '',
            index: true
        },
        /** Snapshot of the latest webhook status we saw. */
        status: {
            type: String,
            default: 'PENDING',
            index: true
        },
        verifiedAppliedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
)

businessPaymentMethodSetupSchema.index({ externalId: 1 }, { unique: true })

const BusinessPaymentMethodSetup = mongoose.model('BusinessPaymentMethodSetup', businessPaymentMethodSetupSchema)

export default BusinessPaymentMethodSetup

