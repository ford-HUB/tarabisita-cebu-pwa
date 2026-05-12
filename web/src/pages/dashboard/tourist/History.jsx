import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTouristOrders } from '../../../hooks/useTouristOrders.hook'
import TouristOrdersHeaderSection from '../../../components/tourist/orders/sections/TouristOrdersHeaderSection'
import TouristOrdersListSection from '../../../components/tourist/orders/sections/TouristOrdersListSection'
import TouristPostOrderReviewModal from '../../../components/tourist/reviews/TouristPostOrderReviewModal.jsx'

const History = () => {
  const { orders, isLoading, errorMessage, refreshOrders } = useTouristOrders()
  const [searchParams, setSearchParams] = useSearchParams()
  const [reviewModal, setReviewModal] = useState({
    open: false,
    orderId: '',
    businessId: '',
    businessName: ''
  })

  const reviewOrderParam = searchParams.get('reviewOrder') || ''
  const reviewBusinessParam = searchParams.get('reviewBusiness') || ''
  const reviewStoreParam = useMemo(() => {
    try {
      return decodeURIComponent(String(searchParams.get('reviewStore') || '').trim()) || 'Restaurant'
    } catch {
      return 'Restaurant'
    }
  }, [searchParams])

  const clearReviewParams = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('reviewOrder')
    next.delete('reviewBusiness')
    next.delete('reviewStore')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    document.title = 'History | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  useEffect(() => {
    if (!reviewOrderParam || !reviewBusinessParam) return
    setReviewModal({
      open: true,
      orderId: reviewOrderParam,
      businessId: reviewBusinessParam,
      businessName: reviewStoreParam
    })
  }, [reviewOrderParam, reviewBusinessParam, reviewStoreParam])

  const closeReviewModal = useCallback(() => {
    setReviewModal((s) => ({ ...s, open: false }))
    clearReviewParams()
  }, [clearReviewParams])

  const handleReviewSubmitted = useCallback(() => {
    void refreshOrders()
  }, [refreshOrders])

  return (
    <div className="space-y-8 md:space-y-10">
      <TouristOrdersHeaderSection
        eyebrow="Your orders"
        title="History"
        description="Every dish you ordered is listed below. Use Re-order to open it on Explore when the restaurant still has it available; if it is hidden or out of stock, you will see a short message instead."
      />
      <TouristOrdersListSection
        orders={orders}
        isLoading={isLoading}
        errorMessage={errorMessage}
        variant="history"
        onRequestRestaurantReview={(order) => {
          if (!order?.id || !order?.businessId) return
          setReviewModal({
            open: true,
            orderId: String(order.id),
            businessId: String(order.businessId),
            businessName: String(order.businessName || 'Restaurant')
          })
        }}
      />
      <TouristPostOrderReviewModal
        isOpen={reviewModal.open}
        onClose={closeReviewModal}
        orderId={reviewModal.orderId}
        businessName={reviewModal.businessName}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  )
}

export default History
