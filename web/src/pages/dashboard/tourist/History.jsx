import { useEffect } from 'react'
import { useTouristOrders } from '../../../hooks/useTouristOrders.hook'
import TouristOrdersHeaderSection from '../../../components/tourist/orders/sections/TouristOrdersHeaderSection'
import TouristOrdersListSection from '../../../components/tourist/orders/sections/TouristOrdersListSection'

const History = () => {
  const { orders, isLoading, errorMessage } = useTouristOrders({ includeFinished: true })

  useEffect(() => {
    document.title = 'History | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <div className="space-y-8 md:space-y-10">
      <TouristOrdersHeaderSection
        eyebrow="Your orders"
        title="History"
        description="Every dish you ordered is listed below. Use Re-order to open it on Explore when the restaurant still has it available; if it is hidden or out of stock, you will see a short message instead."
      />
      <TouristOrdersListSection orders={orders} isLoading={isLoading} errorMessage={errorMessage} variant="history" />
    </div>
  )
}

export default History
