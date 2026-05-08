import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessDashboard } from '../../../hooks/useBusinessDashboard.hook'
import {
  KpiCardsSection,
  MonthlySalesSection,
  MonthlyTargetSection,
  OrderStatusCountsSection,
  RecentOrdersSection,
  StatisticsSection,
  TopProductsSection
} from '../../../components/business/dashboard/sections'

const Home = () => {
  const { user } = useAuth()
  const normalizedCategory = String(user?.businessCategory || '').toUpperCase()
  const isResort = normalizedCategory === 'RESORT'
  const canUseAnalyticsDashboard =
    normalizedCategory === 'RESTAURANT' || normalizedCategory === 'RESORT' || normalizedCategory === 'HOTEL'

  const {
    isLoading,
    isUnavailable,
    errorMessage,
    overviewTabs,
    orderStatusFilters,
    activeOverviewTab,
    setActiveOverviewTab,
    activeOrderFilter,
    setActiveOrderFilter,
    monthlySales,
    statisticsByMonth,
    recentOrders,
    topProducts,
    totals,
    monthlyTarget,
    maxMonthlySales,
    chartGeometry,
    activeYear,
    formatCurrency
  } = useBusinessDashboard({ isResortDashboard: isResort })

  if (!canUseAnalyticsDashboard) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-[#1f1f1f]">Welcome, {user?.name || 'Business owner'}</h1>
          <p className="mt-2 text-sm text-[#4f4f4f]">
            Your dashboard is ready. Submit your business proof to complete account verification and unlock full access.
          </p>
        </section>
      </div>
    )
  }

  if (isUnavailable) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#ece3d9] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Dashboard</h1>
          <p className="mt-2 text-sm text-[#7a7169]">{errorMessage}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {isLoading && (
        <div
          aria-live="polite"
          className="rounded-2xl border border-[#ece3d9] bg-white px-4 py-2 text-xs text-[#7a7169] shadow-sm"
        >
          Loading the latest data...
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <KpiCardsSection totals={totals} orderCountLabel={isResort ? 'Bookings' : 'Orders'} />
          <MonthlySalesSection monthlySales={monthlySales} maxMonthlySales={maxMonthlySales} />
        </div>

        <MonthlyTargetSection monthlyTarget={monthlyTarget} formatCurrency={formatCurrency} />
      </section>

      <StatisticsSection
        overviewTabs={overviewTabs}
        activeOverviewTab={activeOverviewTab}
        setActiveOverviewTab={setActiveOverviewTab}
        statisticsByMonth={statisticsByMonth}
        chartGeometry={chartGeometry}
        activeYear={activeYear}
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <RecentOrdersSection
          recentOrders={recentOrders}
          orderStatusFilters={orderStatusFilters}
          activeOrderFilter={activeOrderFilter}
          setActiveOrderFilter={setActiveOrderFilter}
          formatCurrency={formatCurrency}
          title={isResort ? 'Recent Bookings' : 'Recent Orders'}
          subtitle={isResort ? 'Filter rows by latest booking status' : 'Filter rows by latest order status'}
        />
        <TopProductsSection topProducts={topProducts} formatCurrency={formatCurrency} />
      </section>

      {!isResort ? <OrderStatusCountsSection totals={totals} /> : null}
    </div>
  )
}

export default Home
