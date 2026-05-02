import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessChangePasswordFormSchema } from '../shared/validators/profile.validator'

const defaultValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export const useChangePasswordFormModal = ({ isOpen, onClose, onSubmitPassword, isChangingPassword }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(businessChangePasswordFormSchema),
    defaultValues
  })

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  const handleClose = () => {
    if (isChangingPassword) {
      return
    }
    reset(defaultValues)
    onClose()
  }

  const onValidSubmit = handleSubmit(async (values) => {
    const payload = {
      currentPassword: String(values.currentPassword ?? '').trim(),
      newPassword: String(values.newPassword ?? '').trim(),
      confirmPassword: String(values.confirmPassword ?? '').trim()
    }
    const ok = await onSubmitPassword(payload)
    if (ok) {
      reset(defaultValues)
    }
  })

  return {
    register,
    errors,
    handleClose,
    onValidSubmit
  }
}
