import mongoose from 'mongoose'

const restaurantOrderReviewSchema = new mongoose.Schema(
    {
        customerOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomerOrder',
            required: true,
            unique: true,
            index: true
        },
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            default: '',
            maxlength: 2000,
            trim: true
        }
    },
    { timestamps: true, collection: 'restaurantorderreviews' }
)

restaurantOrderReviewSchema.index({ businessId: 1, createdAt: -1 })

const RestaurantOrderReview = mongoose.model('RestaurantOrderReview', restaurantOrderReviewSchema)

export default RestaurantOrderReview
