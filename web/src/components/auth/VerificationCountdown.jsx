import { useEffect, useMemo, useState } from 'react'

const VerificationCountdown = ({ initialSeconds = 300, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)

  useEffect(() => {
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.()
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previousTime) => previousTime - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [onExpire, timeLeft])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [timeLeft])

  return (
    <p className="text-sm text-[#6f6a62]">
      Code expires in <span className="font-semibold text-[#c66b2b]">{formattedTime}</span>
    </p>
  )
}

export default VerificationCountdown
