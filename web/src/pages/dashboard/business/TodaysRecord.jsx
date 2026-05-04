import ResolvedOrdersSection from '../../../components/business/menu/sections/order-board/ResolvedOrdersSection'
import { useCustomerOrders } from '../../../hooks/useCustomerOrders.hook'

const TodaysRecord = () => {
  const { resolvedOrders } = useCustomerOrders()

  return (
    <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Your business</p>
        <h1 className="text-xl font-semibold text-[#2f2f2f]">Today&apos;s record</h1>
        <p className="text-sm text-[#6f665d]">Completed and canceled orders for today.</p>
      </header>

      <ResolvedOrdersSection orders={resolvedOrders} />
    </div>
  )
}

export default TodaysRecord
