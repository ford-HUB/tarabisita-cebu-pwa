import {
    getBusinessSettingsByUserId,
    updateBusinessSettingsByUserId,
    verifyBusinessPaymentMethodByUserId,
    createBusinessPaymentMethodSetupCheckoutByUserId,
    changeBusinessPasswordByUserId,
    getBusinessActivityLogsByUserId,
    getBusinessProfileByUserId,
    getBusinessProfileByUserIdForCategory,
    updateBusinessMenuItemStockByUserId,
    submitBusinessProofByUserId,
    updateBusinessProfileByUserId,
    uploadBusinessAccountAvatarByUserId,
    uploadBusinessBannerImageByUserId,
    uploadBusinessProfileImageByUserId
} from './profile.service.js'
import { appendActivityLog } from '../../../shared/utils/business-controller.helpers.js'

export const getMyBusinessSettings = async (req, res) => {
    try {
        const settings = await getBusinessSettingsByUserId(req.user._id)
        return res.status(200).json({ data: settings })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessSettings = async (req, res) => {
    try {
        const settings = await updateBusinessSettingsByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'BUSINESS_SETTINGS_UPDATED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: 'Business account settings were updated.'
        })

        return res.status(200).json({
            message: 'Business settings updated successfully',
            data: settings
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'PAYMENT_METHOD_REQUIRES_VERIFICATION') {
            return res.status(409).json({ message: 'Please verify all enabled payment methods before saving.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const verifyMyBusinessPaymentMethod = async (req, res) => {
    try {
        const data = await verifyBusinessPaymentMethodByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'PAYMENT_METHOD_VERIFIED',
            category: 'ACCOUNT_PROFILE',
            severity: 'LOW',
            description: `Business payment method ${data.methodCode} was verified with Xendit.`
        })
        return res.status(200).json({
            message: `${data.methodCode} was verified successfully.`,
            data
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (error.message === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (error.message === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (error.message === 'XENDIT_METHOD_NOT_ENABLED') {
            return res.status(409).json({ message: 'This payment method is disabled in Xendit environment settings.' })
        }
        if (error.message === 'XENDIT_AUTH_FAILED') {
            return res.status(500).json({ message: 'Could not verify against Xendit. Please check API credentials.' })
        }
        if (error.message === 'PAYMENT_METHOD_NOT_SUPPORTED') {
            return res.status(400).json({ message: 'Unsupported payment method.' })
        }
        return res.status(500).json({ message: error.message || 'Could not verify payment method.' })
    }
}

export const createMyBusinessPaymentMethodSetupCheckout = async (req, res) => {
    try {
        const data = await createBusinessPaymentMethodSetupCheckoutByUserId(req.user._id, req.validatedData.body)
        return res.status(200).json({
            message: 'Payment method setup checkout created.',
            data
        })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
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
            return res.status(400).json({ message: 'Invalid return base URL.' })
        }
        if (msg === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build return URLs.' })
        }
        if (msg === 'PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT') {
            return res.status(409).json({ message: 'This payment method is disabled in Xendit environment settings.' })
        }
        return res.status(500).json({ message: error.message || 'Could not start setup checkout.' })
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

export const getMyRestaurantBusinessProfile = async (req, res) => {
    try {
        const businessProfile = await getBusinessProfileByUserIdForCategory(req.user._id, 'restaurant')
        await appendActivityLog(req, {
            action: 'PROFILE_VIEWED',
            category: 'ACCOUNT_PROFILE',
            severity: 'INFO',
            description: 'Business restaurant profile page data was viewed.'
        })
        return res.status(200).json({ data: businessProfile })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'BUSINESS_CATEGORY_MISMATCH') {
            return res.status(403).json({ message: 'This endpoint is only available for restaurant business accounts.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const getMyResortBusinessProfile = async (req, res) => {
    try {
        const businessProfile = await getBusinessProfileByUserIdForCategory(req.user._id, 'resort')
        await appendActivityLog(req, {
            action: 'PROFILE_VIEWED',
            category: 'ACCOUNT_PROFILE',
            severity: 'INFO',
            description: 'Business resort profile page data was viewed.'
        })
        return res.status(200).json({ data: businessProfile })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'BUSINESS_CATEGORY_MISMATCH') {
            return res.status(403).json({ message: 'This endpoint is only available for resort and hotel business accounts.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyResortListingStock = async (req, res) => {
    try {
        const { menuItemId } = req.validatedData.params
        const { stockStatus } = req.validatedData.body
        const updatedItem = await updateBusinessMenuItemStockByUserId(req.user._id, menuItemId, stockStatus)
        await appendActivityLog(req, {
            action: 'LISTING_AVAILABILITY_UPDATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'Resort listing availability was updated.',
            details: {
                menuItemId,
                stockStatus
            }
        })
        return res.status(200).json({
            message: 'Listing availability updated successfully',
            data: updatedItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Listing not found' })
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
