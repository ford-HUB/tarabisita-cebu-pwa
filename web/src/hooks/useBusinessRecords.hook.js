import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { recordsFilterSchema } from '../shared/validators/records.validator'

const resolvedOrders = [
  {
    id: 'ORD-12020',
    customer: 'Sofia Lopez',
    product: 'Lechon Kawali Platter',
    total: 'PHP 1,780.00',
    items: 5,
    status: 'SUCCESS',
    date: '2026-05-01'
  },
  {
    id: 'ORD-12018',
    customer: 'Miguel Ramos',
    product: 'Chicken BBQ Skewers',
    total: 'PHP 620.00',
    items: 2,
    status: 'SUCCESS',
    date: '2026-05-01'
  },
  {
    id: 'ORD-12016',
    customer: 'Janice Cruz',
    product: 'Pancit Canton',
    total: 'PHP 480.00',
    items: 2,
    status: 'SUCCESS',
    date: '2026-05-01'
  },
  {
    id: 'ORD-12015',
    customer: 'Carla George',
    product: 'Halo-Halo Supreme',
    total: 'PHP 365.00',
    items: 1,
    status: 'CANCELLED',
    date: '2026-05-01'
  },
  {
    id: 'ORD-12011',
    customer: 'Leo Martin',
    product: 'Beef Kare-Kare',
    total: 'PHP 1,240.00',
    items: 4,
    status: 'SUCCESS',
    date: '2026-04-30'
  },
  {
    id: 'ORD-12008',
    customer: 'Paolo Reyes',
    product: 'Sizzling Sisig',
    total: 'PHP 510.00',
    items: 2,
    status: 'CANCELLED',
    date: '2026-04-30'
  },
  {
    id: 'ORD-12004',
    customer: 'Nina Valdez',
    product: 'Spicy Chicken Inasal',
    total: 'PHP 905.00',
    items: 3,
    status: 'SUCCESS',
    date: '2026-04-29'
  },
  {
    id: 'ORD-11999',
    customer: 'Bryan Lim',
    product: 'Seafood Palabok',
    total: 'PHP 960.00',
    items: 3,
    status: 'SUCCESS',
    date: '2026-04-29'
  },
  {
    id: 'ORD-11992',
    customer: 'Anne Villanueva',
    product: 'Pork Adobo Meal',
    total: 'PHP 1,120.00',
    items: 4,
    status: 'CANCELLED',
    date: '2026-04-28'
  },
  {
    id: 'ORD-11988',
    customer: 'Maria Santos',
    product: 'Spicy Chicken Inasal',
    total: 'PHP 835.00',
    items: 3,
    status: 'SUCCESS',
    date: '2026-04-28'
  },
  {
    id: 'ORD-11984',
    customer: 'John Dela Cruz',
    product: 'Sizzling Sisig',
    total: 'PHP 540.00',
    items: 2,
    status: 'SUCCESS',
    date: '2026-04-28'
  },
  {
    id: 'ORD-11980',
    customer: 'Lea Fernandez',
    product: 'Halo-Halo Supreme',
    total: 'PHP 210.00',
    items: 1,
    status: 'CANCELLED',
    date: '2026-04-27'
  }
]

const PAGE_SIZE = 5

export const useBusinessRecords = () => {
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

  const filteredOrders = useMemo(() => {
    const query = String(filters?.search || '')
      .trim()
      .toLowerCase()
    const status = filters?.status || 'ALL'
    const startDate = filters?.startDate || ''
    const endDate = filters?.endDate || ''

    return resolvedOrders.filter((order) => {
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
  }, [filters])

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
