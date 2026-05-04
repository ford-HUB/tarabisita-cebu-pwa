import { create } from 'zustand'
import {
  checkUser,
  loginUser,
  logoutUser,
  mailChecker,
  registerUser,
  requestForgotPassword,
  resendVerficiationCode,
  resetPassword,
  sendVerificationCode,
  verifyCode
} from '../../services/auth/auth.service'

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
  isCheckingAuth: false,
  hasCheckedAuth: false,

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
      const loginUserPayload = response.data?.properties?.user || null
      set({
        user: loginUserPayload,
        isAuthenticated: true,
        hasCheckedAuth: true
      })

      try {
        const checkUserResponse = await checkUser()
        if (checkUserResponse?.data?.user) {
          set({ user: checkUserResponse.data.user, isAuthenticated: true, hasCheckedAuth: true })
        }
      } catch (checkUserError) {
        console.error('Failed to hydrate user profile after login', checkUserError)
      }

      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  logout: async () => {
    try {
      await logoutUser()
      set({ user: null, isAuthenticated: false, hasCheckedAuth: true })
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

  requestForgotPassword: async (data) => {
    try {
      const response = await requestForgotPassword(data)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await resetPassword(data)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  mailChecker: async (data) => {
    try {
      const response = await mailChecker(data)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  checkUser: async (options = {}) => {
    const silent = Boolean(options?.silent)
    try {
      if (!silent) {
        set({ isCheckingAuth: true })
      }
      const response = await checkUser()
      set({
        user: response.data.user,
        isAuthenticated: true,
        ...(silent ? {} : { isCheckingAuth: false }),
        hasCheckedAuth: true
      })
      return response
    } catch (error) {
      if (!silent) {
        set({
          user: null,
          isAuthenticated: false,
          isCheckingAuth: false,
          hasCheckedAuth: true
        })
      }
      return null
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

  setUser: (nextUser) => {
    set((state) => ({
      user: { ...(state.user || {}), ...nextUser }
    }))
  }
}))
