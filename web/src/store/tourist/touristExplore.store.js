import { create } from 'zustand'
import { toast } from 'sonner'
import {
  fetchPublicBusinesses,
  fetchPublicMenuFeed,
  fetchGuestMenuFeed,
  recordPublicBusinessView
} from '../../services/tourist/touristExplore.service.js'

export const useTouristExploreStore = create((set, get) => ({
  businesses: [],
  isLoading: false,
  errorMessage: null,

  menuFeedItems: [],
  menuFeedCategories: [],
  menuFeedLoading: false,
  menuFeedError: null,

  setBusinesses: (businesses) => set({ businesses }),

  loadPublicBusinesses: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      const { data } = await fetchPublicBusinesses()
      set({ businesses: Array.isArray(data?.data) ? data.data : [], isLoading: false })
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Could not load places.'
      set({ errorMessage: message, isLoading: false })
      toast.error(message)
    }
  },

  applyViewCount: (businessId, publicProfileViewCount) =>
    set((state) => ({
      businesses: state.businesses.map((b) =>
        String(b._id) === String(businessId) ? { ...b, publicProfileViewCount } : b
      )
    })),

  recordView: async (businessId) => {
    try {
      const { data } = await recordPublicBusinessView(businessId)
      const next = data?.data?.publicProfileViewCount
      if (typeof next === 'number') {
        get().applyViewCount(businessId, next)
      }
    } catch {
      /* non-blocking */
    }
  },

  /**
   * @param {string} [menuCategory]
   * @param {{ guest?: boolean }} [options] When true, uses unauthenticated guest catalog API.
   */
  loadMenuFeed: async (menuCategory = 'ALL', options = {}) => {
    const guest = Boolean(options?.guest)
    set({ menuFeedLoading: true, menuFeedError: null })
    try {
      const { data } = await (guest ? fetchGuestMenuFeed(menuCategory) : fetchPublicMenuFeed(menuCategory))
      const payload = data?.data
      set({
        menuFeedItems: Array.isArray(payload?.items) ? payload.items : [],
        menuFeedCategories: Array.isArray(payload?.categories) ? payload.categories : [],
        menuFeedLoading: false,
        menuFeedError: null
      })
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Could not load menu items.'
      set({
        menuFeedItems: [],
        menuFeedCategories: [],
        menuFeedLoading: false,
        menuFeedError: message
      })
      toast.error(message)
    }
  }
}))
