import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTrafficInsightsStore } from '../store/business/trafficInsights.store.js'

const resolveTodayManilaDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

export const useBusinessTrafficInsights = () => {
  const { data, selectedDate, isLoading, errorMessage, setSelectedDate, loadInsights } = useTrafficInsightsStore(
    useShallow((state) => ({
      data: state.data,
      selectedDate: state.selectedDate,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      setSelectedDate: state.setSelectedDate,
      loadInsights: state.loadInsights
    }))
  )

  const activeDate = selectedDate || resolveTodayManilaDate()

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(activeDate)
    }
  }, [activeDate, selectedDate, setSelectedDate])

  useEffect(() => {
    if (!activeDate) return
    void loadInsights(activeDate)
  }, [activeDate, loadInsights])

  const refreshInsights = useCallback(() => {
    void loadInsights(activeDate)
  }, [activeDate, loadInsights])

  const ordersByHour = useMemo(
    () => (Array.isArray(data?.ordersByHour) ? data.ordersByHour : []),
    [data?.ordersByHour]
  )

  return {
    data,
    summary: data?.summary || null,
    ordersByHour,
    selectedDate: activeDate,
    setSelectedDate,
    isLoading,
    errorMessage,
    refreshInsights
  }
}
