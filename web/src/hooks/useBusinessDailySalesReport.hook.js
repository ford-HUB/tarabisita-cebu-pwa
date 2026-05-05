import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDailySalesReportStore } from '../store/business/dailySalesReport.store.js'

const resolveTodayManilaDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

export const useBusinessDailySalesReport = () => {
  const { report, selectedDate, isLoading, errorMessage, setSelectedDate, loadReport } = useDailySalesReportStore(
    useShallow((state) => ({
      report: state.report,
      selectedDate: state.selectedDate,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      setSelectedDate: state.setSelectedDate,
      loadReport: state.loadReport
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
    void loadReport(activeDate)
  }, [activeDate, loadReport])

  const refreshReport = useCallback(() => {
    void loadReport(activeDate)
  }, [activeDate, loadReport])

  const topItems = useMemo(() => (Array.isArray(report?.topItems) ? report.topItems : []), [report?.topItems])

  return {
    report,
    topItems,
    selectedDate: activeDate,
    setSelectedDate,
    isLoading,
    errorMessage,
    refreshReport
  }
}
