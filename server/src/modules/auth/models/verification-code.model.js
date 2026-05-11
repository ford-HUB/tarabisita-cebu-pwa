import mongoose from 'mongoose'

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },

    used: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true
    },

    /** `EMAIL_CHANGE`: code is emailed to `pendingEmail`; user confirms to update login email. */
    purpose: {
        type: String,
        enum: ['DEFAULT', 'EMAIL_CHANGE'],
        default: 'DEFAULT'
    },

    pendingEmail: {
        type: String,
        default: null
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

const VerificationCode = mongoose.model('VerificationCode', verificationSchema)

export default VerificationCode