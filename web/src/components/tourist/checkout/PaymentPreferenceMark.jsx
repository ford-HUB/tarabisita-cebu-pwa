import { useCallback, useState } from 'react'

/**
 * Checkout payment tile mark: Brandfetch Brand API asset URL when provided, else the configured icon.
 */
const PaymentPreferenceMark = ({ option, iconSrc }) => {
  const Icon = option.Icon
  const [useFallback, setUseFallback] = useState(false)

  const src = !useFallback && iconSrc ? iconSrc : null

  const onError = useCallback(() => {
    setUseFallback(true)
  }, [])

  if (!src) {
    return <Icon className="h-6 w-6" aria-hidden />
  }

  return (
    <img
      src={src}
      alt=""
      width={24}
      height={24}
      loading="lazy"
      decoding="async"
      className="h-6 w-6 object-contain"
      aria-hidden
      onError={onError}
    />
  )
}

export default PaymentPreferenceMark
