import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminApprovalActionNotesSchema } from '../shared/validators/adminRequestApproval.validator'

const defaultValues = { notes: '' }

export const useAdminApprovalActionModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminApprovalActionNotesSchema),
    defaultValues
  })

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  const handleClose = () => {
    if (isSubmitting) {
      return
    }
    reset(defaultValues)
    onClose()
  }

  const onValidSubmit = handleSubmit(async (values) => {
    await onConfirm(values.notes ?? '')
  })

  return {
    register,
    errors,
    handleClose,
    onValidSubmit
  }
}
