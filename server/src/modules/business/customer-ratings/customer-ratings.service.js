import mongoose from 'mongoose'
import Business from '../models/business.model.js'
import RestaurantOrderReview from '../../tourist/restaurant-order-reviews/models/restaurant-order-review.model.js'

const roundRating = (value) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return null
    return Math.round(n * 10) / 10
}

const resolveBusinessCategory = (business) => {
    if (typeof business?.category === 'object' && business?.category?.name != null) {
        return String(business.category.name).trim().toUpperCase()
    }
    return String(business?.category || '').trim().toUpperCase()
}

const authorLabelFromUser = (user) => {
    const name = String(user?.name || '').trim()
    if (!name) return 'Verified diner'
    const first = name.split(/\s+/)[0]
    return first.length > 32 ? `${first.slice(0, 32)}…` : first
}

const resolveSentiment = (rating) => {
    const value = Number(rating)
    if (!Number.isFinite(value)) return 'neutral'
    if (value >= 4) return 'good'
    if (value <= 2) return 'bad'
    return 'neutral'
}

const buildRatingFilter = (sentiment) => {
    const normalized = String(sentiment || 'all').trim().toLowerCase()
    if (normalized === 'good') return { rating: { $gte: 4 } }
    if (normalized === 'bad') return { rating: { $lte: 2 } }
    return {}
}

const mapReviewRow = (row) => ({
    id: String(row._id),
    customerOrderId: String(row.customerOrderId),
    rating: Number(row.rating),
    sentiment: resolveSentiment(row.rating),
    comment: String(row.comment || '').trim(),
    authorLabel: authorLabelFromUser(row.userId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
})

export const getMyCustomerRatingsByUserId = async (userId, { page = 1, limit = 20, sentiment = 'all' } = {}) => {
    const business = await Business.findOne({ userId }).populate('category', 'name').lean()
    if (!business) throw new Error('BUSINESS_NOT_FOUND')

    const category = resolveBusinessCategory(business)
    const businessShape = {
        id: String(business._id),
        name: business.name || 'Business',
        category
    }

    if (category !== 'RESTAURANT') {
        return {
            supported: false,
            business: businessShape,
            summary: {
                averageRating: null,
                reviewCount: 0,
                goodCount: 0,
                badCount: 0,
                neutralCount: 0
            },
            items: [],
            pagination: {
                page: 1,
                limit,
                total: 0,
                totalPages: 0
            }
        }
    }

    const bid = new mongoose.Types.ObjectId(String(business._id))
    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20))
    const skip = (safePage - 1) * safeLimit
    const match = { businessId: bid, ...buildRatingFilter(sentiment) }

    const [summaryAgg, sentimentAgg, total, rows] = await Promise.all([
        RestaurantOrderReview.aggregate([
            { $match: { businessId: bid } },
            {
                $group: {
                    _id: '$businessId',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]),
        RestaurantOrderReview.aggregate([
            { $match: { businessId: bid } },
            {
                $group: {
                    _id: null,
                    goodCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
                    badCount: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } },
                    neutralCount: {
                        $sum: {
                            $cond: [{ $and: [{ $gt: ['$rating', 2] }, { $lt: ['$rating', 4] }] }, 1, 0]
                        }
                    }
                }
            }
        ]),
        RestaurantOrderReview.countDocuments(match),
        RestaurantOrderReview.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .populate('userId', 'name')
            .lean()
    ])

    const summaryRow = summaryAgg[0]
    const sentimentRow = sentimentAgg[0]

    return {
        supported: true,
        business: businessShape,
        summary: {
            averageRating: summaryRow?.reviewCount ? roundRating(summaryRow.averageRating) : null,
            reviewCount: Number(summaryRow?.reviewCount || 0),
            goodCount: Number(sentimentRow?.goodCount || 0),
            badCount: Number(sentimentRow?.badCount || 0),
            neutralCount: Number(sentimentRow?.neutralCount || 0)
        },
        items: rows.map(mapReviewRow),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: total > 0 ? Math.ceil(total / safeLimit) : 0
        }
    }
}
