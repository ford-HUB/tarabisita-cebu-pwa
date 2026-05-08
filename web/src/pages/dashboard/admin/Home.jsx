import { useAuth } from '../../../hooks/useAuth.hook'
import { useAdminDashboard } from '../../../hooks/useAdminDashboard.hook'
import {
  AdminDashboardApprovalStatusSection,
  AdminDashboardCategoryBreakdownSection,
  AdminDashboardHeaderSection,
  AdminDashboardKpiSection,
  AdminDashboardRecentTransactionsSection,
  AdminDashboardRevenueTrendSection
} from '../../../components/ui/admin/dashboard/sections'

const Home = () => {
  const { user } = useAuth()
  const {
    isLoading,
    lastUpdatedAt,
    refresh,
    overviewCards,
    userBreakdown,
    approvalStatusRows,
    categoryRows,
    transactionTotals,
    recentTransactions,
    revenueTrendRows,
    revenueChartGeometry,
    formatCurrency,
    formatDate
  } = useAdminDashboard()

  return (
    <div className="space-y-6">
      <AdminDashboardHeaderSection
        adminName={user?.name}
        isLoading={isLoading}
        lastUpdatedAt={lastUpdatedAt}
        formatDate={formatDate}
        onRefresh={refresh}
      />

      {isLoading ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-[#ece3d9] bg-white px-4 py-2 text-xs text-[#7a7169] shadow-sm"
        >
          Loading admin analytics...
        </div>
      ) : null}

      <AdminDashboardKpiSection cards={overviewCards} />

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Revenue pulse</h2>
          <p className="mt-1 text-sm text-[#7a7169]">Paid revenue from available subscription transactions.</p>
          <p className="mt-5 text-3xl font-bold text-[#202020]">{formatCurrency(transactionTotals.paidRevenue)}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[#166534]">
              Paid: {transactionTotals.paidCount.toLocaleString()}
            </span>
            <span className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-[#92400e]">
              Pending: {transactionTotals.pendingCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="xl:col-span-2">
          <AdminDashboardRecentTransactionsSection
            rows={recentTransactions}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">User breakdown</h2>
          <p className="mt-1 text-sm text-[#7a7169]">Platform users by account role.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-xl border border-[#f1e8de] bg-[#fcfaf7] px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Tourists</p>
              <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">{userBreakdown.tourists.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-[#f1e8de] bg-[#fcfaf7] px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Business</p>
              <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">
                {userBreakdown.businessOwners.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-[#f1e8de] bg-[#fcfaf7] px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Admins</p>
              <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">{userBreakdown.admins.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <AdminDashboardCategoryBreakdownSection rows={categoryRows} />
        <AdminDashboardApprovalStatusSection rows={approvalStatusRows} />
      </section>

      <AdminDashboardRevenueTrendSection chartGeometry={revenueChartGeometry} trendRows={revenueTrendRows} />
    </div>
  )
}

export default Home
