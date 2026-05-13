import { useEffect, useState } from 'react'
import { fetchPublicBusinesses } from '../services/tourist/touristExplore.service.js'
import { rankPublicBusinessesByRatings } from '../shared/utils/touristExplore.utils.js'

/**
 * Loads public partners for the marketing landing page (no global toasts).
 * @param {{ limit?: number }} [opts]
 */
export const useLandingPopularBusinesses = ({ limit = 10 } = {}) => {
  const [businesses, setBusinesses] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    fetchPublicBusinesses()
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res?.data?.data) ? res.data.data : []
        setBusinesses(rankPublicBusinessesByRatings(list, { limit }))
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setBusinesses([])
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return { businesses, status }
}
