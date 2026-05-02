import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { adminTransactionsFilterSchema } from '../shared/validators/adminTransactions.validator'
import { getAdminPlanSubscriptionTransactions } from '../services/business/business.service'
import { buildPlanSubscriptionTransactionsCsv, sortTransactionRows } from '../components/ui/admin/transactions/transactions.utils'
import { PAYMENT_STATUS_FILTER, PERIOD_OPTIONS } from '../components/ui/admin/transactions/transactions.constants'

const defaultFilterValues = {
  search: '',
  period: '7',
  paymentStatus: 'ALL'
}

const mapRow = (item) => ({
  id: item?.id || '',
  orderId: item?.orderId || '—',
  businessName: item?.businessName || '—',
  customerName: item?.customerName || '—',
  email: item?.email || '—',
  amount: item?.amount,
  currency: item?.currency || 'PHP',
  planId: item?.planId || '',
  months: item?.months,
  status: item?.status || 'PENDING',
  paidAt: item?.paidAt,
  createdAt: item?.createdAt,
  subscriptionEndsAt: item?.subscriptionEndsAt
})

export const useAdminTransactions = () => {
  const [rawRows, setRawRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const {
    register,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminTransactionsFilterSchema),
    defaultValues: defaultFilterValues,
    mode: 'onChange'
  })

  const period = watch('period')
  const paymentStatus = watch('paymentStatus')
  const search = watch('search')

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getAdminPlanSubscriptionTransactions({
        days: period,
        status: paymentStatus
      })
      const records = response?.data?.data || []
      setRawRows(records.map(mapRow))
      setSelectedIds(new Set())
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load transactions.')
      setRawRows([])
    } finally {
      setIsLoading(false)
    }
  }, [period, paymentStatus])

  useEffect(() => {
    load()
  }, [load])

  const filteredRows = useMemo(() => {
    const keyword = String(search || '').trim().toLowerCase()
    if (!keyword) return rawRows
    return rawRows.filter((row) =>
      [row.orderId, row.businessName, row.customerName, row.email, row.planId].some((field) =>
        String(field || '').toLowerCase().includes(keyword)
      )
    )
  }, [rawRows, search])

  const sortedRows = useMemo(
    () => sortTransactionRows(filteredRows, { key: sortKey, dir: sortDir }),
    [filteredRows, sortKey, sortDir]
  )

  const onSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

  const toggleRow = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allVisibleSelected =
    sortedRows.length > 0 && sortedRows.every((row) => selectedIds.has(row.id))

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      if (sortedRows.length === 0) return new Set()
      const allSelected = sortedRows.every((row) => prev.has(row.id))
      if (allSelected) return new Set()
      return new Set(sortedRows.map((r) => r.id))
    })
  }, [sortedRows])

  const exportCsv = useCallback(() => {
    const rowsForExport =
      selectedIds.size > 0 ? sortedRows.filter((r) => selectedIds.has(r.id)) : sortedRows
    if (!rowsForExport.length) {
      toast.message('Nothing to export for the current filter.')
      return
    }
    const csv = buildPlanSubscriptionTransactionsCsv(rowsForExport)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `plan-subscription-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded.')
  }, [selectedIds, sortedRows])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period
  const statusFilterLabel =
    PAYMENT_STATUS_FILTER.find((o) => o.value === paymentStatus)?.label ?? paymentStatus

  const downloadSummaryPdf = useCallback(async () => {
    const rowsForSummary =
      selectedIds.size > 0 ? sortedRows.filter((r) => selectedIds.has(r.id)) : sortedRows
    if (!rowsForSummary.length) {
      toast.message('Nothing to include in the PDF for the current filter.')
      return
    }
    const toastId = toast.loading('Building PDF…')
    try {
      const { downloadPlanSubscriptionTransactionsSummaryPdf } = await import(
        '../components/ui/admin/transactions/transactionsSummaryPdf.utils'
      )
      const searchTrim = String(search || '').trim()
      await downloadPlanSubscriptionTransactionsSummaryPdf({
        rows: rowsForSummary,
        periodLabel,
        statusFilterLabel,
        searchQuery: search,
        scopeDescription:
          selectedIds.size > 0
            ? `Selected rows (${rowsForSummary.length} of ${sortedRows.length} visible in the table)`
            : `All visible rows (${rowsForSummary.length}${searchTrim ? '; search filter applied' : ''})`,
        generatedAt: new Date()
      })
      toast.success('PDF report downloaded.', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Could not generate the PDF. Try again.', { id: toastId })
    }
  }, [periodLabel, statusFilterLabel, search, selectedIds, sortedRows])

  return {
    register,
    errors,
    sortedRows,
    isLoading,
    sortKey,
    sortDir,
    onSort,
    selectedIds,
    toggleRow,
    toggleAllVisible,
    allVisibleSelected,
    exportCsv,
    downloadSummaryPdf,
    totalLoaded: rawRows.length,
    visibleCount: sortedRows.length
  }
}
