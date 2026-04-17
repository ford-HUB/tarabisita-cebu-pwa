import mongoose from "mongoose";

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
    coverImage: {
        type: String,
        required: false
    },
    socialMedia: {
        type: Object,
        required: false
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
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