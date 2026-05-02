import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  featureComparisonColumns,
  featureComparisonRows,
  freeTierSummary,
  planBenefits,
  pricingOptions
} from '../components/business/billing/constants/billing.constants'
import { getSubscriptionCatalog } from '../services/business/business.service'

export const getBundledDefaultSubscriptionCatalog = () => ({
  pricing: structuredClone(pricingOptions),
  benefits: structuredClone(planBenefits),
  columns: structuredClone(featureComparisonColumns),
  rows: structuredClone(featureComparisonRows),
  freeTier: structuredClone(freeTierSummary)
})

export const normalizeRemoteSubscriptionCatalog = (data) => {
  if (!data || !Array.isArray(data.pricing) || data.pricing.length === 0) {
    return getBundledDefaultSubscriptionCatalog()
  }
  const fallback = getBundledDefaultSubscriptionCatalog()
  return {
    pricing: structuredClone(data.pricing),
    benefits: Array.isArray(data.benefits) && data.benefits.length ? structuredClone(data.benefits) : fallback.benefits,
    columns: Array.isArray(data.columns) && data.columns.length ? structuredClone(data.columns) : fallback.columns,
    rows: Array.isArray(data.rows) && data.rows.length ? structuredClone(data.rows) : fallback.rows,
    freeTier: Array.isArray(data.freeTier) && data.freeTier.length ? structuredClone(data.freeTier) : fallback.freeTier
  }
}

/**
 * Loads subscription marketing catalog from API (falls back to bundled defaults on failure).
 * Used on the business Billing page so copy matches the admin-managed catalog.
 */
export const useSubscriptionCatalog = () => {
  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getSubscriptionCatalog()
      setCatalog(normalizeRemoteSubscriptionCatalog(res?.data?.data))
    } catch (error) {
      setLoadError(error)
      setCatalog(getBundledDefaultSubscriptionCatalog())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const resolved = useMemo(() => catalog ?? getBundledDefaultSubscriptionCatalog(), [catalog])

  return {
    catalog: resolved,
    isLoading,
    loadError,
    refetch
  }
}
