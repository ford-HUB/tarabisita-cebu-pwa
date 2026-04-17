import { create } from 'zustand'
import { checkUser, loginUser, logoutUser, mailChecker, registerUser, requestForgotPassword, resendVerficiationCode, resetPassword, sendVerificationCode, verifyCode } from '../../services/auth/auth.service'

const VERIFICATION_EXPIRY_STORAGE_KEY = import.meta.env.VITE_VERIFICATION_EXPIRY_STORAGE_KEY

const readVerificationExpiryCache = () => {
  try {
    const rawValue = window.localStorage.getItem(VERIFICATION_EXPIRY_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : {}
  } catch (error) {
    console.error('Failed to read verification expiry cache', error)
    return {}
  }
}

const writeVerificationExpiryCache = (cache) => {
  try {
    window.localStorage.setItem(VERIFICATION_EXPIRY_STORAGE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to write verification expiry cache', error)
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  register: async (data) => {
    try {
      const response = await registerUser(data)
      set({ user: response.data, isAuthenticated: true })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  login: async (data) => {
    try {
      const response = await loginUser(data)
      set({ user: response.data, isAuthenticated: true })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  logout: async () => {
    try {
        await logoutUser()
        set({ user: null, isAuthenticated: false })
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  sendVerificationCode: async (data) => {
    try {
      const response = await sendVerificationCode(data)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  resendVerficiationCode: async (data) => {
    try {
        const response = await resendVerficiationCode(data)
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  verifyCode: async (data) => {
    try {
        const response = await verifyCode(data)
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  requestForgotPassword: async () => {
    try {
        const response = await requestForgotPassword(data)
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  resetPassword: async () => {
    try {
        const response = await resetPassword(data)
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  mailChecker: async () => {
    try {
        const response = await mailChecker(data)
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  checkUser: async () => {
    try {
        const response = await checkUser()
        set({ user: response.data.user, isAuthenticated: true })
    } catch (error) {
        console.error(error)
        throw error
    }
  },

  setVerificationExpiry: ({ sessionToken, expiresAt }) => {
    if (!sessionToken || !expiresAt) {
      return
    }

    const currentCache = readVerificationExpiryCache()
    currentCache[sessionToken] = expiresAt
    writeVerificationExpiryCache(currentCache)
  },

  getVerificationExpiry: (sessionToken) => {
    if (!sessionToken) {
      return null
    }

    const currentCache = readVerificationExpiryCache()
    return currentCache[sessionToken] || null
  },

  clearVerificationExpiry: (sessionToken) => {
    if (!sessionToken) {
      return
    }

    const currentCache = readVerificationExpiryCache()
    delete currentCache[sessionToken]
    writeVerificationExpiryCache(currentCache)
  },
}))