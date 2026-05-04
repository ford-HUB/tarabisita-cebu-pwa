import { apiInstance } from '../../api/_base_.js'

/** Authenticated business: create checkout for plan purchase. */
export const createBusinessBillingCheckout = async (data) => {
  const response = await apiInstance.post('business/me/billing/checkout', data)
  return response
}

/** Authenticated business: billing ledger / history. */
export const getMyBusinessBillingLedger = async () => {
  const response = await apiInstance.get('business/me/billing/ledger', {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
  })
  return response
}

/** Public read: marketing catalog (business billing UI, shared with admin load). */
export const getSubscriptionCatalog = async () => {
  const response = await apiInstance.get('business/subscription-catalog')
  return response
}
