import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { adminTransactionsFilterSchema } from '../shared/validators/adminTransactions.validator'
import { buildPlanSubscriptionTransactionsCsv, sortTransactionRows } from '../components/ui/admin/transactions/transactions.utils'
import { PAYMENT_STATUS_FILTER, PERIOD_OPTIONS } from '../components/ui/admin/transactions/transactions.constants'
import { useAdminTransactionsStore } from '../store/admin/transactions.store'

const defaultFilterValues = {
  search: '',
  period: '7',
  paymentStatus: 'ALL'
}

export const useAdminTransactions = () => {
  const { rawRows, isLoading, sortKey, sortDir, selectedIds } = useAdminTransactionsStore(
    useShallow((s) => ({
      rawRows: s.rawRows,
      isLoading: s.isLoading,
      sortKey: s.sortKey,
      sortDir: s.sortDir,
      selectedIds: s.selectedIds
    }))
  )

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
    await useAdminTransactionsStore.getState().fetchTransactions({ period, paymentStatus })
  }, [period, paymentStatus])

  useEffect(() => {
    void load()
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
    useAdminTransactionsStore.getState().toggleSort(key)
  }, [])

  const toggleRow = useCallback((id) => {
    useAdminTransactionsStore.getState().setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allVisibleSelected =
    sortedRows.length > 0 && sortedRows.every((row) => selectedIds.has(row.id))

  const toggleAllVisible = useCallback(() => {
    useAdminTransactionsStore.getState().setSelectedIds((prev) => {
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
