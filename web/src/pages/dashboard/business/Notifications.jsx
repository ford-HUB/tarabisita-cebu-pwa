import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BusinessNotificationCardsSection from '../../../components/business/notifications/sections/BusinessNotificationCardsSection'
import { businessDashboardHref } from '../../../components/layout/business/businessLayout.constants'
import { useBusinessNotificationsPage } from '../../../hooks/useBusinessNotificationsPage.hook.js'

const Notifications = () => {
  const { unreadCount, items, isLoading, errorMessage } = useBusinessNotificationsPage()

  useEffect(() => {
    document.title = 'Notifications | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Notifications</h1>
          <p className="mt-0.5 text-sm text-[#6d645d]">
            {unreadCount > 0 ? (
              <>
                You have <span className="font-semibold text-[#9b5a2c]">{unreadCount}</span> unread.
              </>
            ) : (
              'Orders and customer messages in one place.'
            )}
          </p>
        </div>
        <nav className="text-xs text-[#8a8179]" aria-label="Breadcrumb">
          <Link to={businessDashboardHref} className="font-medium text-[#9b5a2c] hover:underline">
            Home
          </Link>
          <span className="mx-1.5 text-[#c4b5a8]">/</span>
          <span className="text-[#4a433c]">Notifications</span>
        </nav>
      </div>

      <div className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm md:p-6">
        <BusinessNotificationCardsSection
          items={items}
          isLoading={isLoading}
          errorMessage={errorMessage}
          variant="page"
        />
      </div>
    </section>
  )
}

export default Notifications
