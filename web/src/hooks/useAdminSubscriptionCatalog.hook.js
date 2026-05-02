import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  getBundledDefaultSubscriptionCatalog,
  normalizeRemoteSubscriptionCatalog
} from './useSubscriptionCatalog.hook'
import { getSubscriptionCatalog, putAdminSubscriptionCatalog } from '../services/business/business.service'
import { subscriptionCatalogFormSchema } from '../shared/validators/subscriptionCatalogForm.validator'

const normalizeFreeTierForApi = (freeTier) =>
  (Array.isArray(freeTier) ? freeTier : []).map((entry) => {
    if (Array.isArray(entry)) {
      return [String(entry[0] ?? ''), String(entry[1] ?? '')]
    }
    return [String(entry?.[0] ?? entry?.['0'] ?? ''), String(entry?.[1] ?? entry?.['1'] ?? '')]
  })

export const useAdminSubscriptionCatalog = () => {
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(subscriptionCatalogFormSchema),
    defaultValues: getBundledDefaultSubscriptionCatalog()
  })

  const loadCatalog = useCallback(async () => {
    setIsPageLoading(true)
    try {
      const res = await getSubscriptionCatalog()
      reset(normalizeRemoteSubscriptionCatalog(res?.data?.data))
    } catch {
      toast.error('Could not load catalog from the server; showing bundled defaults.')
      reset(getBundledDefaultSubscriptionCatalog())
    } finally {
      setIsPageLoading(false)
    }
  }, [reset])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const resetToBundledDefaults = useCallback(() => {
    reset(getBundledDefaultSubscriptionCatalog())
    toast.message('Form reset to bundled defaults (not saved until you click Save).')
  }, [reset])

  const onValidSubmit = useCallback(
    async (values) => {
      setIsSaving(true)
      try {
        const payload = {
          ...values,
          freeTier: normalizeFreeTierForApi(values.freeTier)
        }
        const res = await putAdminSubscriptionCatalog(payload)
        reset(normalizeRemoteSubscriptionCatalog(res?.data?.data))
        toast.success('Subscription catalog saved.')
      } catch (error) {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to save catalog.')
      } finally {
        setIsSaving(false)
      }
    },
    [reset]
  )

  const onSubmit = handleSubmit(onValidSubmit)

  return {
    register,
    control,
    errors,
    onSubmit,
    resetToBundledDefaults,
    isPageLoading,
    isSaving,
    reloadCatalog: loadCatalog
  }
}
