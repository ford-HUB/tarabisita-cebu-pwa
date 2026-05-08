import { useCallback, useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import { useShallow } from 'zustand/react/shallow'
import { useAdminSystemPerformanceStore } from '../store/admin/systemPerformance.store'
import { getSocketBaseUrl } from '../shared/utils/socketBase.utils.js'

const toFixedNumber = (value, digits = 2) => Number(Number(value) || 0).toFixed(digits)

const buildLinePath = (values, width, height, maxValue) => {
  if (!Array.isArray(values) || values.length === 0) return ''
  const stepX = width / Math.max(values.length - 1, 1)
  return values
    .map((value, index) => {
      const x = index * stepX
      const y = height - (Number(value) / Math.max(maxValue, 1)) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export const useAdminSystemPerformance = () => {
  const socketRef = useRef(null)
  const { snapshot, isLoading, errorMessage, isSocketConnected } = useAdminSystemPerformanceStore(
    useShallow((state) => ({
      snapshot: state.snapshot,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      isSocketConnected: state.isSocketConnected
    }))
  )

  const refresh = useCallback(async () => {
    await useAdminSystemPerformanceStore.getState().fetchSnapshot()
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const socketBase = getSocketBaseUrl()
    if (!socketBase) return undefined

    const socket = io(`${socketBase}/admin-system-performance`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      useAdminSystemPerformanceStore.getState().setIsSocketConnected(true)
      socket.emit('snapshot:request')
    })

    socket.on('disconnect', () => {
      useAdminSystemPerformanceStore.getState().setIsSocketConnected(false)
    })

    socket.on('system-performance:update', (payload) => {
      useAdminSystemPerformanceStore.getState().setSnapshot(payload || {})
      useAdminSystemPerformanceStore.getState().setIsLoading(false)
      useAdminSystemPerformanceStore.getState().setErrorMessage('')
    })

    return () => {
      const s = socketRef.current
      socketRef.current = null
      s?.removeAllListeners()
      s?.disconnect()
      useAdminSystemPerformanceStore.getState().setIsSocketConnected(false)
    }
  }, [])

  const kpiCards = useMemo(
    () => [
      { label: 'Avg response', value: `${toFixedNumber(snapshot?.http?.avgResponseMs)} ms` },
      { label: 'P95 response', value: `${toFixedNumber(snapshot?.http?.p95ResponseMs)} ms` },
      { label: 'Req/min', value: Number(snapshot?.http?.requestsLastMinute || 0).toLocaleString() },
      { label: 'Event loop p95', value: `${toFixedNumber(snapshot?.eventLoop?.p95Ms)} ms` }
    ],
    [snapshot]
  )

  const responseTimeChart = useMemo(() => {
    const rows = Array.isArray(snapshot?.responseTimeSeries) ? snapshot.responseTimeSeries : []
    const values = rows.map((row) => Number(row?.value) || 0)
    const chartWidth = 900
    const chartHeight = 220
    const maxValue = Math.max(1, ...values)
    const activePath = buildLinePath(values, chartWidth, chartHeight, maxValue)
    const areaPath = activePath ? `${activePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : ''
    return {
      chartWidth,
      chartHeight,
      labels: rows.map((row) => row?.timestamp || null),
      activePath,
      areaPath
    }
  }, [snapshot?.responseTimeSeries])

  const formatTimestamp = useCallback((value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }, [])

  return {
    isLoading,
    errorMessage,
    isSocketConnected,
    snapshot,
    kpiCards,
    responseTimeChart,
    formatTimestamp,
    refresh
  }
}
