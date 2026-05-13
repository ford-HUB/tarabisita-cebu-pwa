import { useEffect, useState } from 'react'
import { fetchPublicLandingRestaurantReviews } from '../services/tourist/touristExplore.service.js'

/**
 * Loads public restaurant order reviews for the marketing landing carousel.
 * @param {{ limit?: number }} [opts]
 */
export const useLandingRestaurantReviews = ({ limit = 12 } = {}) => {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    fetchPublicLandingRestaurantReviews({ limit })
      .then((res) => {
        if (cancelled) return
        const list = res?.data?.data?.reviews
        setReviews(Array.isArray(list) ? list : [])
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return { reviews, status }
}
