import {
    changeBusinessPasswordByUserId,
    getBusinessActivityLogsByUserId,
    getBusinessProfileByUserId,
    submitBusinessProofByUserId,
    updateBusinessProfileByUserId,
    updateBusinessThemeColorByUserId,
    uploadBusinessAccountAvatarByUserId,
    uploadBusinessBannerImageByUserId,
    uploadBusinessProfileImageByUserId
} from './profile.service.js'
import { appendActivityLog } from '../../../shared/utils/business-controller.helpers.js'

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
