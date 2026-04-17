import { toast } from 'sonner'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

const baseOptions = {
  duration: 3500,
}

export const showSuccessToast = (message, options = {}) =>
  toast.success(message, {
    ...baseOptions,
    icon: <FiCheckCircle className="text-[18px] text-[#1a8f57]" />,
    ...options,
  })

export const showErrorToast = (message, options = {}) =>
  toast.error(message, {
    ...baseOptions,
    icon: <FiAlertCircle className="text-[18px] text-[#bb3a2d]" />,
    ...options,
  })
