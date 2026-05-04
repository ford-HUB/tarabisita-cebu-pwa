import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBillingStore } from '../store/billing/billing.store'
import { getBundledDefaultSubscriptionCatalog } from '../shared/utils/subscriptionCatalog.utils'

export { getBundledDefaultSubscriptionCatalog, normalizeRemoteSubscriptionCatalog } from '../shared/utils/subscriptionCatalog.utils'

/**
 * Loads subscription marketing catalog via store (falls back to bundled defaults on failure).
 * Used on the business Billing page so copy matches the admin-managed catalog.
 */
export const useSubscriptionCatalog = () => {
  const { publicCatalog, publicCatalogLoading, publicCatalogLoadError } = useBillingStore(
    useShallow((s) => ({
      publicCatalog: s.publicCatalog,
      publicCatalogLoading: s.publicCatalogLoading,
      publicCatalogLoadError: s.publicCatalogLoadError
    }))
  )

  const refetch = useCallback(async () => {
    await useBillingStore.getState().fetchPublicSubscriptionCatalog()
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const resolved = useMemo(
    () => publicCatalog ?? getBundledDefaultSubscriptionCatalog(),
    [publicCatalog]
  )

  return {
    catalog: resolved,
    isLoading: publicCatalogLoading,
    loadError: publicCatalogLoadError,
    refetch
  }
}
