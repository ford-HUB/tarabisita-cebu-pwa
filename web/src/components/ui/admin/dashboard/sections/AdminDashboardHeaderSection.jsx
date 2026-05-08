const AdminDashboardHeaderSection = ({ adminName, isLoading, lastUpdatedAt, formatDate, onRefresh }) => (
  <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Platform analytics</h1>
        <p className="mt-1 text-sm text-[#5f5f5f]">
          Hi {adminName || 'Administrator'}, monitor users, business verification, and plan transactions.
        </p>
        <p className="mt-2 text-xs text-[#8a7d70]">
          Last updated: {lastUpdatedAt ? formatDate(lastUpdatedAt) : 'Not yet loaded'}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="rounded-xl border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f8f4ee] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </section>
)

export default AdminDashboardHeaderSection
