import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { billingAddressFormSchema } from '../shared/validators/billing.validator'

const defaultValues = {
  name: '',
  street: '',
  cityState: '',
  country: '',
  zipPostal: '',
  townCity: ''
}

const isPromiseLike = (value) => value != null && typeof value.then === 'function'

const trimValues = (values) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value ?? '').trim()]))

const mergeBillingDefaults = (accountDefaults = {}) => ({
  ...defaultValues,
  ...Object.fromEntries(
    Object.keys(defaultValues).map((key) => [
      key,
      String(accountDefaults[key] ?? defaultValues[key] ?? '').trim()
    ])
  )
})

export const useBillingAddressModal = ({ isOpen, onClose, onSave, accountBillingDefaults = {} }) => {
  const [isSaving, setIsSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(billingAddressFormSchema),
    defaultValues
  })

  useEffect(() => {
    if (isOpen) {
      reset(mergeBillingDefaults(accountBillingDefaults))
    }
  }, [isOpen, reset, accountBillingDefaults])

  const handleClose = () => {
    if (isSaving) {
      return
    }
    reset(defaultValues)
    onClose()
  }

  const onValidSubmit = handleSubmit(async (values) => {
    const trimmed = trimValues(values)
    try {
      setIsSaving(true)
      const result = onSave?.(trimmed)
      if (isPromiseLike(result)) {
        await result
      }
      toast.success('Billing address updated.')
      reset(mergeBillingDefaults(accountBillingDefaults))
      onClose()
    } catch (error) {
      toast.error(error?.message || 'Could not save billing address.')
    } finally {
      setIsSaving(false)
    }
  })

  return {
    register,
    errors,
    isSaving,
    handleClose,
    onValidSubmit
  }
}
