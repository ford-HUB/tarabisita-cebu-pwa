import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BusinessCustomerRatingsSection from '../../../components/business/ratings/sections/BusinessCustomerRatingsSection'
import { businessDashboardHref } from '../../../components/layout/business/businessLayout.constants'
import { useBusinessCustomerRatings } from '../../../hooks/useBusinessCustomerRatings.hook.js'

const Ratings = () => {
  const {
    summary,
    items,
    pagination,
    supported,
    sentiment,
    page,
    setSentiment,
    setPage,
    isLoading,
    errorMessage
  } = useBusinessCustomerRatings()

  useEffect(() => {
    document.title = 'Ratings | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Ratings</h1>
          <p className="mt-0.5 text-sm text-[#6d645d]">Review customer feedback from prepaid restaurant orders.</p>
        </div>
        <nav className="text-xs text-[#8a8179]" aria-label="Breadcrumb">
          <Link to={businessDashboardHref} className="font-medium text-[#9b5a2c] hover:underline">
            Home
          </Link>
          <span className="mx-1.5 text-[#c4b5a8]">/</span>
          <span className="text-[#4a433c]">Ratings</span>
        </nav>
      </div>

      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-6">
        <BusinessCustomerRatingsSection
          summary={summary}
          items={items}
          pagination={pagination}
          supported={supported}
          sentiment={sentiment}
          page={page}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onSentimentChange={setSentiment}
          onPageChange={setPage}
        />
      </div>
    </section>
  )
}

export default Ratings
