import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { recordsFilterSchema } from '../shared/validators/records.validator'
import { useCustomerOrders } from './useCustomerOrders.hook'

const PAGE_SIZE = 5
const FALLBACK_DATE_LABEL = '-'

const toDateLabel = (value) => {
  if (!value) return FALLBACK_DATE_LABEL
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return FALLBACK_DATE_LABEL
  return parsedDate.toISOString().slice(0, 10)
}

export const useBusinessRecords = () => {
  const { resolvedOrders } = useCustomerOrders()
  const [currentPage, setCurrentPage] = useState(1)

  const form = useForm({
    resolver: zodResolver(recordsFilterSchema),
    defaultValues: {
      search: '',
      status: 'ALL',
      startDate: '',
      endDate: ''
    },
    mode: 'onChange'
  })

  const filters = useWatch({
    control: form.control
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [filters?.search, filters?.status, filters?.startDate, filters?.endDate])

  const mappedOrders = useMemo(
    () =>
      resolvedOrders.map((order) => ({
        id: order.orderCode || order.id,
        customer: order.customer || 'Unknown customer',
        product: order.productName || 'Unspecified order',
        total: order.total || 'PHP 0.00',
        items: Number.isFinite(Number(order.items)) ? Number(order.items) : 0,
        status: order.status === 'CANCELED' ? 'FAILED' : 'SUCCESS',
        date: toDateLabel(order.createdAt)
      })),
    [resolvedOrders]
  )

  const filteredOrders = useMemo(() => {
    const query = String(filters?.search || '')
      .trim()
      .toLowerCase()
    const status = filters?.status || 'ALL'
    const startDate = filters?.startDate || ''
    const endDate = filters?.endDate || ''

    return mappedOrders.filter((order) => {
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query) ||
        order.total.toLowerCase().includes(query)
      const matchesStatus = status === 'ALL' || order.status === status
      const matchesStartDate = !startDate || order.date >= startDate
      const matchesEndDate = !endDate || order.date <= endDate
      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
    })
  }, [filters, mappedOrders])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredOrders.slice(start, start + PAGE_SIZE)
  }, [filteredOrders, safePage])

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  return {
    form,
    paginatedOrders,
    filteredCount: filteredOrders.length,
    currentPage: safePage,
    totalPages,
    goToPreviousPage,
    goToNextPage
  }
}
