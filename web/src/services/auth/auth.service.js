import { apiInstance } from "../../api/_base_.js"

export const registerUser = async (data) => {
    const response = await apiInstance.post('auth/register', data)
    return response
}

export const loginUser = async (data) => {
    const response = await apiInstance.post('auth/login', data)
    return response
}

export const logoutUser = async () => {
    const response = await apiInstance.post('auth/logout')
    return response
}

export const sendVerificationCode = async (data) => {
    const response = await apiInstance.post('auth/send-verification', data)
    return response
}

export const resendVerficiationCode = async (data) => {
    const response = await apiInstance.post('auth/resend-verification', data)
    return response
}

export const verifyCode = async (data) => {
    const response = await apiInstance.post('auth/verify-code', data)
    return response
}

export const requestForgotPassword = async (data) => {
    const response = await apiInstance.post('auth/request-reset-password', data)
    return response
}

export const resetPassword = async (data) => {
    const response = await apiInstance.post('auth/reset-password', data)
    return response
} 

export const mailChecker = async (data) => {
    const response = await apiInstance.post('auth/mail-checker', data)
    return response
}

export const checkUser = async () => {
    const response = await apiInstance.get('auth/check-user')
    return response
}

export const getAdminUsers = async (params) => {
    const response = await apiInstance.get('auth/admin/users', { params })
    return response
}

export const patchAdminUserWhitelist = async (userId, whitelisted) => {
    const response = await apiInstance.patch(`auth/admin/users/${userId}/whitelist`, { whitelisted })
    return response
}

export const deleteAdminUser = async (userId) => {
    const response = await apiInstance.delete(`auth/admin/users/${userId}`)
    return response
}

export const sendAdminUserWarningEmail = async (userId, formData) => {
    const response = await apiInstance.post(`auth/admin/users/${userId}/warning-email`, formData)
    return response
}