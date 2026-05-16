import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    /** Optional alternate sign-in email for tourists (unique only when set; field omitted when unused). */
    supportEmail: {
        type: String,
        required: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: null
    },

    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },

    /** When false, login is blocked (platform suspension / denylist). */
    whitelisted: {
        type: Boolean,
        default: true
    }
})

userSchema.index({ supportEmail: 1 }, { unique: true, sparse: true })

const User = mongoose.model('User', userSchema)

export default User