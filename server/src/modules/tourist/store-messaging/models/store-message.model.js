import mongoose from 'mongoose'

const storeMessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StoreConversation',
            required: true,
            index: true
        },
        senderUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        senderRole: {
            type: String,
            enum: ['TOURIST', 'BUSINESS'],
            required: true
        },
        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000
        }
    },
    { timestamps: true, collection: 'storemessages' }
)

storeMessageSchema.index({ conversationId: 1, createdAt: 1 })

const StoreMessage = mongoose.model('StoreMessage', storeMessageSchema)

export default StoreMessage
