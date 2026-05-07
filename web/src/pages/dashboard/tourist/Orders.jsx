import { useEffect } from 'react'
import { useTouristOrders } from '../../../hooks/useTouristOrders.hook'
import TouristOrdersHeaderSection from '../../../components/tourist/orders/sections/TouristOrdersHeaderSection'
import TouristOrdersListSection from '../../../components/tourist/orders/sections/TouristOrdersListSection'

const Orders = () => {
  const { storeOrderGroups, isLoading, errorMessage } = useTouristOrders()

  useEffect(() => {
    document.title = 'Orders | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <div className="space-y-8 md:space-y-10">
      <TouristOrdersHeaderSection />
      <TouristOrdersListSection
        groups={storeOrderGroups}
        isLoading={isLoading}
        errorMessage={errorMessage}
        excludeStatuses={['FINISHED']}
      />
    </div>
  )
}

export default Orders
