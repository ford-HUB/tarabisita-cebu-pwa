import {
  featureComparisonColumns,
  featureComparisonRows,
  freeTierSummary,
  planBenefits,
  pricingOptions
} from '../../components/business/billing/constants/billing.constants'

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
