import Business from '../models/business.model.js'
import {
    attachStayOccupancyToPublicMenuItems,
    incrementPublicBusinessProfileViewCount,
    listPublicMenuItemsFromBusinessDoc,
    listPublicMenuFeedItems,
    createTouristCustomerOrder,
    createTouristMenuOrderXenditCheckout
} from './public-catalog.service.js'
import { sanitizeBusinessPayload } from '../../../shared/utils/business-controller.helpers.js'
import {
    getRestaurantRecentReviewsGrouped,
    getRestaurantReviewPublicSummary,
    getRestaurantReviewStatsMapForBusinessIds
} from '../../tourist/restaurant-order-reviews/restaurant-order-reviews.service.js'

const hasActivePaidSubscription = (business) => {
    const sub = business?.subscription || {}
    if (sub.status !== 'ACTIVE') {
        return false
    }
    const startedAt = sub.startedAt ? new Date(sub.startedAt) : null
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null
    if (!startedAt || Number.isNaN(startedAt.getTime())) {
        return false
    }
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return false
    }
    const now = Date.now()
    return startedAt.getTime() <= now && expiresAt.getTime() > now
}

const TOURIST_CHECKOUT_METHOD_CODES = ['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']

const resolveAvailableTouristPaymentMethods = (business) => {
    const paymentMethods = business?.settings?.paymentMethods || {}
    return TOURIST_CHECKOUT_METHOD_CODES.filter(
        (code) => paymentMethods?.[code]?.enabled === true && Boolean(paymentMethods?.[code]?.isVerified)
    )
}

export const getPublicMenuFeed = async (req, res) => {
    try {
        // Public catalog items include computed occupancy; prevent stale client/browser caches.
        res.set('Cache-Control', 'no-store')
        const menuCategory =
            req.query.menuCategory != null && String(req.query.menuCategory).trim() !== ''
                ? String(req.query.menuCategory).trim()
                : 'ALL'
        const data = await listPublicMenuFeedItems({ menuCategory })
        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const postTouristCustomerOrderCheckout = async (req, res) => {
    try {
        const { businessId } = req.params
        const { returnBaseUrl, ...body } = req.validatedData.body
        const data = await createTouristMenuOrderXenditCheckout({
            userId: req.user._id,
            businessId,
            ...body,
            returnBaseUrl
        })
        return res.status(200).json({
            message: 'Xendit checkout created. Complete payment to place your order.',
            data
        })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'BUSINESS_NOT_FOUND' || msg === 'MENU_CATALOG_NOT_SUPPORTED') {
            return res.status(404).json({ message: 'Business not found or not available for booking/orders.' })
        }
        if (msg.startsWith('MENU_ITEM_NOT_FOUND') || msg.startsWith('MENU_ITEM_UNAVAILABLE')) {
            return res
                .status(400)
                .json({ message: 'One or more menu items are no longer available. Refresh and try again.' })
        }
        if (msg === 'INVALID_PRICE' || msg === 'INVALID_ORDER_AMOUNT') {
            return res.status(400).json({ message: 'Could not validate menu prices or order total.' })
        }
        if (msg === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (msg === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (msg === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (msg === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({
                message:
                    'Invalid return base URL. Send returnBaseUrl (e.g. https://your-site.com) or set CLIENT_URL / XENDIT_RETURN_BASE_URL.'
            })
        }
        if (msg === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build success or cancel return URLs.' })
        }
        if (msg === 'PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT') {
            return res.status(400).json({
                message:
                    'This payment method is disabled in server settings. Choose another option or ask the site admin to update XENDIT_PAYMENT_METHODS.'
            })
        }
        if (msg === 'PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS') {
            return res.status(409).json({
                message: 'This payment method is currently unavailable for this business. Please choose another option.'
            })
        }
        if (msg.startsWith('MONTHLY_ORDER_CAP_REACHED')) {
            const [, cap] = msg.split(':')
            const limitLabel = cap ? Number(cap).toLocaleString('en-PH') : 'the current'
            return res.status(409).json({
                message: `This business reached its monthly order limit (${limitLabel}) for the active plan.`
            })
        }
        return res.status(500).json({ message: error.message || 'Could not start checkout.' })
    }
}

export const postTouristCustomerOrder = async (req, res) => {
    try {
        const { businessId } = req.params
        const data = await createTouristCustomerOrder({
            businessId,
            placedByUserId: req.user._id,
            ...req.body
        })
        return res.status(201).json({ data })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'BUSINESS_NOT_FOUND' || msg === 'MENU_CATALOG_NOT_SUPPORTED') {
            return res.status(404).json({ message: 'Business not found or not available for booking/orders.' })
        }
        if (msg.startsWith('MENU_ITEM_NOT_FOUND') || msg.startsWith('MENU_ITEM_UNAVAILABLE')) {
            return res
                .status(400)
                .json({ message: 'One or more menu items are no longer available. Refresh and try again.' })
        }
        if (msg === 'INVALID_PRICE') {
            return res.status(400).json({ message: 'Could not validate menu prices.' })
        }
        if (msg.startsWith('MONTHLY_ORDER_CAP_REACHED')) {
            const [, cap] = msg.split(':')
            const limitLabel = cap ? Number(cap).toLocaleString('en-PH') : 'the current'
            return res.status(409).json({
                message: `This business reached its monthly order limit (${limitLabel}) for the active plan.`
            })
        }
        return res.status(500).json({ message: error.message || 'Could not place order.' })
    }
}

export const getPublicBusinesses = async (_req, res) => {
    try {
        const businesses = await Business.find({ verificationStatus: 'VERIFIED' })
            .populate('category')
            .sort({ publicProfileViewCount: -1, createdAt: -1 })

        const filtered = businesses.filter(hasActivePaidSubscription)
        const ids = filtered.map((b) => b._id)
        const statsMap = await getRestaurantReviewStatsMapForBusinessIds(ids)
        const recentMap = await getRestaurantRecentReviewsGrouped(ids, { perBusiness: 3 })

        return res.status(200).json({
            data: filtered.map((b) => {
                const id = String(b._id)
                const stats = statsMap.get(id) || { averageRating: null, reviewCount: 0 }
                const recentReviews = recentMap.get(id) || []
                return {
                    ...sanitizeBusinessPayload(b),
                    restaurantReviewSummary: {
                        averageRating: stats.averageRating,
                        reviewCount: stats.reviewCount,
                        recentReviews
                    }
                }
            })
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const recordPublicBusinessView = async (req, res) => {
    try {
        const { businessId } = req.params
        const business = await incrementPublicBusinessProfileViewCount(businessId)

        if (!business) {
            return res.status(404).json({ message: 'Business not found' })
        }

        return res.status(200).json({
            data: { publicProfileViewCount: business.publicProfileViewCount ?? 0 }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getBusinessById = async (req, res) => {
    try {
        // Public business payload includes computed stay occupancy; prevent stale client/browser caches.
        res.set('Cache-Control', 'no-store')
        const { businessId } = req.params
        const business = await Business.findById(businessId).populate('category')

        if (!business) {
            return res.status(404).json({ message: 'Business not found' })
        }

        if (business.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({ message: 'Business is not yet publicly available' })
        }
        if (!hasActivePaidSubscription(business)) {
            return res.status(403).json({ message: 'Business is not yet publicly available' })
        }

        const menuItems = await attachStayOccupancyToPublicMenuItems(
            business,
            listPublicMenuItemsFromBusinessDoc(business)
        )

        const restaurantReviewSummary = await getRestaurantReviewPublicSummary(business._id, { recentLimit: 8 })

        return res.status(200).json({
            data: {
                ...sanitizeBusinessPayload(business),
                menuItems,
                availablePaymentMethods: resolveAvailableTouristPaymentMethods(business),
                restaurantReviewSummary
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
