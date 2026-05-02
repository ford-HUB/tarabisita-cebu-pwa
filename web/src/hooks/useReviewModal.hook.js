import { useEffect, useState } from 'react'

export const useReviewModal = (requestId) => {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setActiveStep(0)
    })
    return () => cancelAnimationFrame(frameId)
  }, [requestId])

  const goToStep = (step) => {
    setActiveStep(Math.max(0, Math.min(1, step)))
  }

  return {
    activeStep,
    setActiveStep: goToStep,
    goPrevious: () => setActiveStep((step) => Math.max(step - 1, 0)),
    goNext: () => setActiveStep((step) => Math.min(step + 1, 1))
  }
}
