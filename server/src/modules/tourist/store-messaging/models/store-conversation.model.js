import mongoose from 'mongoose'

const storeConversationSchema = new mongoose.Schema(
    {
        touristUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: true,
            index: true
        },
        customerOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomerOrder',
            required: true,
            index: true
        },
        /** Snapshot of the order at first open; shown for the life of the thread. */
        orderSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        lastMessageAt: {
            type: Date,
            default: null
        },
        /** When the business account last opened this thread; tourist messages after this count as unread for the business. */
        businessLastReadAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true, collection: 'storeconversations' }
)

storeConversationSchema.index({ touristUserId: 1, businessId: 1, customerOrderId: 1 }, { unique: true })

const StoreConversation = mongoose.model('StoreConversation', storeConversationSchema)

export default StoreConversation
