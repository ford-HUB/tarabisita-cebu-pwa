import Business from './Business.model.js'
import {
    changeBusinessPasswordByUserId,
    createBusinessActivityLogByUserId,
    createBusinessMenuItemByUserId,
    deleteBusinessMenuItemByUserId,
    getBusinessActivityLogsByUserId,
    getBusinessApprovalRequests,
    getBusinessPartnersForAdmin,
    getBusinessMenuItemsByUserId,
    getBusinessProfileByUserId,
    restoreBusinessMenuItemByUserId,
    submitBusinessProofByUserId,
    updateBusinessMenuItemByUserId,
    updateBusinessMenuItemStockByUserId,
    updateBusinessThemeColorByUserId,
    updateBusinessVerificationStatusById,
    updateBusinessProfileByUserId,
    uploadBusinessAccountAvatarByUserId,
    uploadBusinessBannerImageByUserId,
    uploadBusinessProfileImageByUserId,
    createBusinessBillingCheckoutSessionByUserId,
    getBusinessBillingLedgerByUserId,
    listAdminPlanSubscriptionTransactions,
    processPaymongoWebhookEvent,
    registerPaymongoWebhook
} from './business.service.js'

const extractRequestMeta = (req) => {
    const forwardedFor = req.headers['x-forwarded-for']
    const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : String(forwardedFor || req.ip || '').split(',')[0].trim()
    const userAgent = String(req.headers['user-agent'] || '')
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'MOBILE' : 'WEB_DESKTOP'

    return { ipAddress, userAgent, device }
}

const appendActivityLog = async (req, payload) => {
    try {
        await createBusinessActivityLogByUserId(req.user._id, {
            ...payload,
            ...extractRequestMeta(req)
        })
    } catch (error) {
        console.error('Activity log write failed:', error.message)
    }
}

const sanitizeBusinessPayload = (business) => ({
    _id: business._id,
    name: business.name,
    description: business.description,
    address: business.address,
    contact_info: business.contact_info,
    website: business.website,
    logo: business.logo,
    coverImage: business.coverImage,
    banner: business.banner || business.coverImage,
    socialMedia: business.socialMedia,
    category: business.category,
    verificationStatus: business.verificationStatus
})

export const getPublicBusinesses = async (_req, res) => {
    try {
        const businesses = await Business.find({ verificationStatus: 'VERIFIED' })
            .populate('category')
            .sort({ createdAt: -1 })

        return res.status(200).json({
            data: businesses.map(sanitizeBusinessPayload)
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getBusinessById = async (req, res) => {
    try {
        const { businessId } = req.params
        const business = await Business.findById(businessId).populate('category')

        if (!business) {
            return res.status(404).json({ message: 'Business not found' })
        }

        if (business.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({ message: 'Business is not yet publicly available' })
        }

        return res.status(200).json({
            data: sanitizeBusinessPayload(business)
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getMyBusinessProfile = async (req, res) => {
    try {
        const businessProfile = await getBusinessProfileByUserId(req.user._id)
        await appendActivityLog(req, {
            action: 'PROFILE_VIEWED',
            category: 'ACCOUNT_PROFILE',
            severity: 'INFO',
            description: 'Business profile page data was viewed.'
        })
        return res.status(200).json({ data: businessProfile })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessProfile = async (req, res) => {
    try {
        const updatedProfile = await updateBusinessProfileByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'PROFILE_UPDATED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: 'Business profile information was updated.',
            details: {
                ownerName: updatedProfile.ownerName,
                businessName: updatedProfile.name
            }
        })

        return res.status(200).json({
            message: 'Business profile updated successfully',
            data: updatedProfile
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const uploadMyBusinessProfileImage = async (req, res) => {
    try {
        const { profileImage } = req.validatedData.body
        const updatedProfile = await uploadBusinessProfileImageByUserId(req.user._id, profileImage)
        await appendActivityLog(req, {
            action: 'BUSINESS_LOGO_UPDATED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: 'Business logo was updated.'
        })

        return res.status(200).json({
            message: 'Profile image uploaded successfully',
            data: updatedProfile
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const uploadMyBusinessAccountAvatar = async (req, res) => {
    try {
        const { avatarImage } = req.validatedData.body
        const updatedProfile = await uploadBusinessAccountAvatarByUserId(req.user._id, avatarImage)
        await appendActivityLog(req, {
            action: 'ACCOUNT_AVATAR_UPDATED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: 'Business account avatar was updated.'
        })

        return res.status(200).json({
            message: 'Account avatar uploaded successfully',
            data: updatedProfile
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const uploadMyBusinessBannerImage = async (req, res) => {
    try {
        const { bannerImage } = req.validatedData.body
        const updatedProfile = await uploadBusinessBannerImageByUserId(req.user._id, bannerImage)
        await appendActivityLog(req, {
            action: 'BUSINESS_BANNER_UPDATED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: 'Business banner image was updated.'
        })

        return res.status(200).json({
            message: 'Banner image uploaded successfully',
            data: updatedProfile
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessThemeColor = async (req, res) => {
    try {
        const { themeColor } = req.validatedData.body
        const updatedProfile = await updateBusinessThemeColorByUserId(req.user._id, themeColor)
        await appendActivityLog(req, {
            action: 'THEME_COLOR_UPDATED',
            category: 'ACCOUNT_SETTINGS',
            severity: 'LOW',
            description: 'Business theme color preference was updated.',
            details: { themeColor }
        })

        return res.status(200).json({
            message: 'Business theme color updated successfully',
            data: updatedProfile
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const changeMyBusinessPassword = async (req, res) => {
    try {
        await changeBusinessPasswordByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'PASSWORD_CHANGED',
            category: 'ACCOUNT_SECURITY',
            severity: 'HIGH',
            description: 'Business account password was changed.'
        })

        return res.status(200).json({
            message: 'Password changed successfully'
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'INVALID_CURRENT_PASSWORD') {
            return res.status(400).json({ message: 'Current password is incorrect' })
        }
        if (error.message === 'NEW_PASSWORD_SAME_AS_CURRENT') {
            return res.status(400).json({ message: 'New password must be different from current password' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const submitBusinessProof = async (req, res) => {
    try {
        const updatedBusiness = await submitBusinessProofByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'BUSINESS_PROOF_SUBMITTED',
            category: 'VERIFICATION',
            severity: 'MEDIUM',
            description: 'Business verification proof was submitted.',
            details: {
                proofCount: updatedBusiness.verificationProofs?.length || 0
            }
        })

        return res.status(200).json({
            message: 'Business verification proof submitted successfully',
            data: updatedBusiness
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'PROOF_REQUIRED') {
            return res.status(400).json({ message: 'At least one valid proof is required' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getBusinessApprovalQueue = async (req, res) => {
    try {
        const status = req.query.status
        const requests = await getBusinessApprovalRequests({ status })

        return res.status(200).json({ data: requests })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getBusinessPartners = async (_req, res) => {
    try {
        const partners = await getBusinessPartnersForAdmin()
        return res.status(200).json({ data: partners })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getAdminPlanSubscriptionTransactions = async (req, res) => {
    try {
        const { days, status } = req.validatedData.query
        const rows = await listAdminPlanSubscriptionTransactions({ days, status })
        return res.status(200).json({ data: rows })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const updateBusinessApprovalStatus = async (req, res) => {
    try {
        const { businessId } = req.params
        const { status, notes } = req.body

        const updated = await updateBusinessVerificationStatusById({ businessId, status, notes })

        return res.status(200).json({
            message: 'Business verification status updated successfully',
            data: updated
        })
    } catch (error) {
        if (error.message === 'INVALID_STATUS') {
            return res.status(400).json({ message: 'Invalid verification status' })
        }
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getMyBusinessMenuItems = async (req, res) => {
    try {
        const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true'
        const menuItems = await getBusinessMenuItemsByUserId(req.user._id, { includeDeleted })
        await appendActivityLog(req, {
            action: 'MENU_ITEMS_VIEWED',
            category: 'MENU_MANAGEMENT',
            severity: 'INFO',
            description: 'Business menu items were viewed.',
            details: {
                includeDeleted
            }
        })
        return res.status(200).json({ data: menuItems })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const createMyBusinessMenuItem = async (req, res) => {
    try {
        const createdItem = await createBusinessMenuItemByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_CREATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A menu item was created.',
            details: {
                menuItemId: createdItem.id,
                menuItemName: createdItem.name
            }
        })
        return res.status(201).json({
            message: 'Menu item created successfully',
            data: createdItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const deleteMyBusinessMenuItem = async (req, res) => {
    try {
        await deleteBusinessMenuItemByUserId(req.user._id, req.validatedData.params.menuItemId)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_DELETED',
            category: 'MENU_MANAGEMENT',
            severity: 'MEDIUM',
            description: 'A menu item was moved to deleted list.',
            details: {
                menuItemId: req.validatedData.params.menuItemId
            }
        })
        return res.status(200).json({ message: 'Menu item moved to deleted list successfully' })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        if (error.message === 'MENU_ITEM_ALREADY_DELETED') {
            return res.status(400).json({ message: 'Menu item is already deleted' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessMenuItemStock = async (req, res) => {
    try {
        const { menuItemId } = req.validatedData.params
        const { stockStatus } = req.validatedData.body
        const updatedItem = await updateBusinessMenuItemStockByUserId(req.user._id, menuItemId, stockStatus)
        await appendActivityLog(req, {
            action: 'MENU_STOCK_STATUS_UPDATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'Menu item stock status was updated.',
            details: {
                menuItemId,
                stockStatus
            }
        })
        return res.status(200).json({
            message: 'Menu availability updated successfully',
            data: updatedItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const restoreMyBusinessMenuItem = async (req, res) => {
    try {
        const restoredItem = await restoreBusinessMenuItemByUserId(req.user._id, req.validatedData.params.menuItemId)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_RESTORED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A deleted menu item was restored.',
            details: {
                menuItemId: restoredItem.id,
                menuItemName: restoredItem.name
            }
        })
        return res.status(200).json({
            message: 'Menu item restored successfully',
            data: restoredItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_DELETED') {
            return res.status(400).json({ message: 'Menu item is not deleted' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessMenuItem = async (req, res) => {
    try {
        const { menuItemId } = req.validatedData.params
        const updatedItem = await updateBusinessMenuItemByUserId(req.user._id, menuItemId, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_UPDATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A menu item was updated.',
            details: {
                menuItemId: updatedItem.id,
                menuItemName: updatedItem.name
            }
        })
        return res.status(200).json({
            message: 'Menu item updated successfully',
            data: updatedItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const createMyBusinessBillingCheckout = async (req, res) => {
    try {
        const { months, returnBaseUrl } = req.validatedData.body
        const checkout = await createBusinessBillingCheckoutSessionByUserId(req.user._id, months, { returnBaseUrl })
        await appendActivityLog(req, {
            action: 'BILLING_CHECKOUT_CREATED',
            category: 'BILLING',
            severity: 'MEDIUM',
            description: 'Billing checkout session was created.',
            details: {
                months
            }
        })
        return res.status(200).json({
            message: 'PayMongo checkout created successfully',
            data: checkout
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'INVALID_BILLING_MONTHS') {
            return res.status(400).json({ message: 'Invalid billing duration' })
        }
        if (error.message === 'PAYMONGO_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'PayMongo secret key is not configured' })
        }
        if (error.message === 'PAYMONGO_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'PayMongo secret key must start with sk_' })
        }
        if (error.message === 'PAYMONGO_CHECKOUT_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'PayMongo checkout URL is not configured' })
        }
        if (error.message === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({
                message:
                    'Invalid return base URL. Send returnBaseUrl (e.g. https://your-site.com) or set CLIENT_URL / PAYMONGO_RETURN_BASE_URL to a full http(s) URL.'
            })
        }
        if (error.message === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build success or cancel return URLs.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getMyBusinessBillingLedger = async (req, res) => {
    try {
        const data = await getBusinessBillingLedgerByUserId(req.user._id)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
        res.set('Pragma', 'no-cache')
        return res.status(200).json({ data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getMyBusinessActivityLogs = async (req, res) => {
    try {
        const limit = req.query.limit
        const logs = await getBusinessActivityLogsByUserId(req.user._id, { limit })
        await appendActivityLog(req, {
            action: 'ACTIVITY_LOG_VIEWED',
            category: 'ACCOUNT_SECURITY',
            severity: 'INFO',
            description: 'Business account activity logs were viewed.',
            details: {
                limit: Number(limit) || 30
            }
        })
        return res.status(200).json({
            data: logs
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const handlePaymongoCheckoutWebhook = async (req, res) => {
    try {
        const result = await processPaymongoWebhookEvent(req.body, req.headers)
        return res.status(200).json({
            message: result.duplicate ? 'Duplicate webhook ignored' : 'Webhook processed',
            data: result
        })
    } catch (error) {
        // PayMongo retries on non-2xx; respond 200 with failure info for observability
        // while avoiding retry storms that could create noisy duplicates.
        return res.status(200).json({
            message: 'Webhook accepted with processing error',
            error: error.message
        })
    }
}

export const registerPaymongoWebhookEndpoint = async (req, res) => {
    try {
        const result = await registerPaymongoWebhook(req.validatedData.body || {})
        return res.status(200).json({
            message: result.alreadyExists
                ? 'PayMongo webhook already exists for this callback URL'
                : 'PayMongo webhook registered successfully',
            data: result
        })
    } catch (error) {
        if (error.message === 'PAYMONGO_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'PayMongo secret key is not configured' })
        }
        if (error.message === 'PAYMONGO_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'PayMongo secret key must start with sk_' })
        }
        if (error.message === 'PAYMONGO_WEBHOOK_CALLBACK_URL_NOT_CONFIGURED') {
            return res.status(400).json({
                message: 'Callback URL is required. Provide callbackUrl in request body or set SERVER_PUBLIC_URL.'
            })
        }
        return res.status(500).json({ message: error.message })
    }
}

