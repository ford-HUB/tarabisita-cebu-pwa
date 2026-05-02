import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    flavor: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        default: ''
    },
    preparationTime: {
        type: String,
        default: ''
    },
    servingSize: {
        type: String,
        default: ''
    },
    spiceLevel: {
        type: String,
        default: 'No Spice'
    },
    allergens: {
        type: String,
        default: ''
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    stockStatus: {
        type: String,
        enum: ['AVAILABLE_TO_ORDER', 'OUT_OF_STOCK'],
        default: 'AVAILABLE_TO_ORDER'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    images: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true })

const businessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contact_info: {
        type: Object,
        required: true
    },
    website: {
        type: String,
        required: false
    },
    logo: {
        type: String,
        required: false
    },
    businessLocation: {
        lat: {
            type: Number,
            default: 0
        },
        lng: {
            type: Number,
            default: 0
        }
    },
    coverImage: {
        type: String,
        required: false
    },
    banner: {
        type: String,
        required: false
    },
    socialMedia: {
        type: Object,
        required: false
    },
    themeColor: {
        type: String,
        default: '#ff7a1a'
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    verificationProofs: {
        type: [String],
        default: []
    },
    verificationNotes: {
        type: String,
        default: null
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    menuItems: {
        type: [menuItemSchema],
        default: []
    },
    /** Canonical billing row in `BusinessSubscription` (pending checkout or active paid period). */
    billingSubscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessSubscription',
        default: null,
        index: true
    },
    billing: {
        lastAmount: { type: Number, default: null },
        lastStatus: {
            type: String,
            enum: ['NONE', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'],
            default: 'NONE'
        },
        lastPaidAt: { type: Date, default: null }
    },
    subscription: {
        status: {
            type: String,
            enum: ['INACTIVE', 'ACTIVE', 'CANCELLED', 'FAILED'],
            default: 'INACTIVE'
        },
        planId: {
            type: String,
            default: null
        },
        months: {
            type: Number,
            default: null
        },
        amount: {
            type: Number,
            default: null
        },
        startedAt: {
            type: Date,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        },
        paymentId: {
            type: String,
            default: null
        },
        requestReferenceNumber: {
            type: String,
            default: null
        }
    },
    /** @deprecated — use `BusinessSubscription` with `checkoutSessionId`. Kept for legacy DB reads only. */
    billingCheckoutSessions: {
        type: [
            {
                checkoutId: { type: String, default: '' },
                requestReferenceNumber: { type: String, default: '' },
                planId: { type: String, default: '' },
                months: { type: Number, default: null },
                amount: { type: Number, default: null },
                status: {
                    type: String,
                    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
                    default: 'PENDING'
                },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: null
    }
})

const Business = mongoose.model('Business', businessSchema)

export default Business