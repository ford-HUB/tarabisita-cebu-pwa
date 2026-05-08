import { apiInstance } from '../../api/_base_.js'

export const patchTouristProfile = async (body) => {
  const response = await apiInstance.patch('tourist/account/profile', body)
  return response
}

export const postTouristUploadAvatar = async (avatarImage) => {
  const response = await apiInstance.post('tourist/account/avatar', { avatarImage })
  return response
}

export const postTouristChangePassword = async (body) => {
  const response = await apiInstance.post('tourist/account/change-password', body)
  return response
}

export const postTouristEmailChangeRequest = async (body) => {
  const response = await apiInstance.post('tourist/account/email-change/request', body)
  return response
}

export const postTouristEmailChangeResend = async (body) => {
  const response = await apiInstance.post('tourist/account/email-change/resend', body)
  return response
}

export const postTouristEmailChangeConfirm = async (body) => {
  const response = await apiInstance.post('tourist/account/email-change/confirm', body)
  return response
}
