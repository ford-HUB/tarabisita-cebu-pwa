import {
    updateTouristProfileByUserId,
    uploadTouristAccountAvatarByUserId,
    changeTouristPasswordByUserId,
    requestTouristEmailChange,
    resendTouristEmailChangeCode,
    confirmTouristEmailChange,
    updateTouristSupportEmailByUserId,
    requestTouristSupportEmailVerification,
    resendTouristSupportEmailVerification,
    confirmTouristSupportEmailVerification
} from './tourist-account.service.js'

const mapUserResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    supportEmail: user.supportEmail || null,
    role: user.roleId?.name,
    avatar: user.avatar || null
})

export const postMyTouristUploadAvatar = async (req, res) => {
    try {
        const { avatarImage } = req.validatedData.body
        const user = await uploadTouristAccountAvatarByUserId(req.user._id, avatarImage)
        return res.status(200).json({
            message: 'Profile photo uploaded successfully',
            user: mapUserResponse(user)
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const patchMyTouristProfile = async (req, res) => {
    try {
        const user = await updateTouristProfileByUserId(req.user._id, req.validatedData.body)
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: mapUserResponse(user)
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'INVALID_NAME' || error.message === 'NO_UPDATES') {
            return res.status(400).json({ message: 'Invalid profile update' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postMyTouristChangePassword = async (req, res) => {
    try {
        await changeTouristPasswordByUserId(req.user._id, req.validatedData.body)
        return res.status(200).json({ message: 'Password changed successfully' })
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

export const postRequestTouristEmailChange = async (req, res) => {
    try {
        const { newEmail } = req.validatedData.body
        const result = await requestTouristEmailChange(req.user._id, newEmail)
        return res.status(200).json({
            message: 'Verification code sent to your new email',
            properties: {
                sessionToken: result.sessionToken,
                expiresAt: result.expiresAt
            }
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'EMAIL_UNCHANGED') {
            return res.status(400).json({ message: 'That is already your email address' })
        }
        if (error.message === 'EMAIL_IN_USE') {
            return res.status(409).json({ message: 'That email is already registered' })
        }
        if (error.message === 'EMAIL_SAME_AS_SUPPORT') {
            return res.status(400).json({
                message: 'Choose a different address than your support email, or remove the support email first.'
            })
        }
        if (error.message === 'INVALID_EMAIL') {
            return res.status(400).json({ message: 'Invalid email' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postResendTouristEmailChange = async (req, res) => {
    try {
        const { sessionToken } = req.validatedData.body
        const result = await resendTouristEmailChangeCode(req.user._id, sessionToken)
        return res.status(200).json({
            message: 'Verification code resent',
            properties: { expiresAt: result.expiresAt }
        })
    } catch (error) {
        if (
            error.message === 'EMAIL_CHANGE_SESSION_NOT_FOUND' ||
            error.message === 'EMAIL_CHANGE_INVALID'
        ) {
            return res.status(404).json({ message: 'Email change session not found' })
        }
        if (error.message === 'EMAIL_CHANGE_EXPIRED') {
            return res.status(400).json({ message: 'Verification expired. Start again with your new email.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postConfirmTouristEmailChange = async (req, res) => {
    try {
        const { sessionToken, code } = req.validatedData.body
        const user = await confirmTouristEmailChange(req.user._id, sessionToken, code)
        return res.status(200).json({
            message: 'Email updated successfully',
            user: mapUserResponse(user)
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'EMAIL_CHANGE_SESSION_NOT_FOUND') {
            return res.status(404).json({ message: 'Email change session not found' })
        }
        if (error.message === 'EMAIL_CHANGE_ALREADY_USED') {
            return res.status(400).json({ message: 'This verification was already used' })
        }
        if (error.message === 'EMAIL_CHANGE_EXPIRED') {
            return res.status(400).json({ message: 'Verification expired. Request a new code.' })
        }
        if (error.message === 'INVALID_VERIFICATION_CODE') {
            return res.status(400).json({ message: 'Invalid verification code' })
        }
        if (error.message === 'EMAIL_IN_USE') {
            return res.status(409).json({ message: 'That email is already registered' })
        }
        if (error.message === 'EMAIL_CHANGE_INVALID') {
            return res.status(400).json({ message: 'Invalid email change request' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postRequestTouristSupportEmailVerification = async (req, res) => {
    try {
        const { supportEmail } = req.validatedData.body
        const result = await requestTouristSupportEmailVerification(req.user._id, supportEmail)
        return res.status(200).json({
            message: 'Verification code sent to your support email address',
            properties: {
                sessionToken: result.sessionToken,
                expiresAt: result.expiresAt
            }
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'SUPPORT_EMAIL_UNCHANGED') {
            return res.status(400).json({ message: 'That is already your support email' })
        }
        if (error.message === 'SUPPORT_EMAIL_SAME_AS_PRIMARY') {
            return res.status(400).json({ message: 'Support email must be different from your sign-in email' })
        }
        if (error.message === 'SUPPORT_EMAIL_IN_USE') {
            return res.status(409).json({ message: 'That email is already in use on another account' })
        }
        if (error.message === 'INVALID_EMAIL') {
            return res.status(400).json({ message: 'Invalid email' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postResendTouristSupportEmailVerification = async (req, res) => {
    try {
        const { sessionToken } = req.validatedData.body
        const result = await resendTouristSupportEmailVerification(req.user._id, sessionToken)
        return res.status(200).json({
            message: 'Verification code resent',
            properties: { expiresAt: result.expiresAt }
        })
    } catch (error) {
        if (
            error.message === 'SUPPORT_EMAIL_SESSION_NOT_FOUND' ||
            error.message === 'SUPPORT_EMAIL_SESSION_INVALID'
        ) {
            return res.status(404).json({ message: 'Support email verification session not found' })
        }
        if (error.message === 'SUPPORT_EMAIL_SESSION_EXPIRED') {
            return res.status(400).json({ message: 'Verification expired. Start again with your support email.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const postConfirmTouristSupportEmailVerification = async (req, res) => {
    try {
        const { sessionToken, code } = req.validatedData.body
        const user = await confirmTouristSupportEmailVerification(req.user._id, sessionToken, code)
        return res.status(200).json({
            message: 'Support email verified and saved',
            user: mapUserResponse(user)
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'SUPPORT_EMAIL_SESSION_NOT_FOUND') {
            return res.status(404).json({ message: 'Support email verification session not found' })
        }
        if (error.message === 'SUPPORT_EMAIL_SESSION_USED') {
            return res.status(400).json({ message: 'This verification was already used' })
        }
        if (error.message === 'SUPPORT_EMAIL_SESSION_EXPIRED') {
            return res.status(400).json({ message: 'Verification expired. Request a new code.' })
        }
        if (error.message === 'INVALID_VERIFICATION_CODE') {
            return res.status(400).json({ message: 'Invalid verification code' })
        }
        if (error.message === 'SUPPORT_EMAIL_IN_USE') {
            return res.status(409).json({ message: 'That email is already in use on another account' })
        }
        if (error.message === 'SUPPORT_EMAIL_SAME_AS_PRIMARY') {
            return res.status(400).json({ message: 'Support email must be different from your sign-in email' })
        }
        if (error.message === 'SUPPORT_EMAIL_SESSION_INVALID') {
            return res.status(400).json({ message: 'Invalid support email verification request' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const patchMyTouristSupportEmail = async (req, res) => {
    try {
        const { supportEmail } = req.validatedData.body
        const user = await updateTouristSupportEmailByUserId(req.user._id, supportEmail)
        return res.status(200).json({
            message: 'Support email removed',
            user: mapUserResponse(user)
        })
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' })
        }
        if (error.message === 'SUPPORT_EMAIL_USE_VERIFICATION') {
            return res.status(400).json({
                message: 'Adding or changing a support email requires email verification. Use the support email setup flow.'
            })
        }
        return res.status(500).json({ message: error.message })
    }
}
