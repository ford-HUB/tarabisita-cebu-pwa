import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { getBundledDefaultSubscriptionCatalog } from '../shared/utils/subscriptionCatalog.utils'
import { subscriptionCatalogFormSchema } from '../shared/validators/subscriptionCatalogForm.validator'
import { useAdminSubscriptionCatalogStore } from '../store/admin/subscriptionCatalog.store'

export const useAdminSubscriptionCatalog = () => {
  const { isPageLoading, isSaving } = useAdminSubscriptionCatalogStore(
    useShallow((s) => ({
      isPageLoading: s.isPageLoading,
      isSaving: s.isSaving
    }))
  )

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
    const result = await useAdminSubscriptionCatalogStore.getState().loadRemoteCatalog()
    reset(result.data)
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
      const result = await useAdminSubscriptionCatalogStore.getState().saveRemoteCatalog(values)
      if (result?.ok && result.data) {
        reset(result.data)
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
