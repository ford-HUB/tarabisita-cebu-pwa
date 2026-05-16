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
    const response = await apiInstance.post('auth/mail-checker', data, {
        validateStatus: (status) => status === 200 || status === 404,
    })
    return response
}

export const checkUser = async () => {
    const response = await apiInstance.get('auth/check-user')
    return response
}