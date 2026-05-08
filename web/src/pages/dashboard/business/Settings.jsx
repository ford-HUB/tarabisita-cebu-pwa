import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { businessDashboardHref } from '../../../components/layout/business/businessLayout.constants'
import { useBusinessSettings } from '../../../hooks/useBusinessSettings.hook'
import { useAuth } from '../../../hooks/useAuth.hook'

const Settings = () => {
  const { user } = useAuth()
  const normalizedCategory = String(user?.businessCategory || '').trim().toUpperCase()
  const isResortBusiness = normalizedCategory === 'RESORT' || normalizedCategory === 'HOTEL'

  const {
    settings,
    isLoadingSettings,
    isSavingSettings,
    hasUnsavedChanges,
    updateBooleanSetting,
    updateSelectSetting,
    saveSettings,
    resetToSaved
  } = useBusinessSettings()

  useEffect(() => {
    document.title = 'Business Settings | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Settings</h1>
          <p className="mt-0.5 text-sm text-[#6d645d]">
            Configure your business essentials for notifications,{' '}
            {isResortBusiness ? 'booking workflow, and listing defaults.' : 'order workflow, and inventory defaults.'}
          </p>
        </div>
        <nav className="text-xs text-[#8a8179]" aria-label="Breadcrumb">
          <Link to={businessDashboardHref} className="font-medium text-[#9b5a2c] hover:underline">
            Home
          </Link>
          <span className="mx-1.5 text-[#c4b5a8]">/</span>
          <span className="text-[#4a433c]">Settings</span>
        </nav>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        {isLoadingSettings ? (
          <div className="rounded-2xl border border-[#e7dfd5] bg-white p-5 text-sm text-[#6d645d] shadow-sm xl:col-span-2">
            Loading business settings...
          </div>
        ) : null}
        <div className="space-y-5">
          <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2f2a26]">Notifications</h2>
            <p className="mt-1 text-sm text-[#6d645d]">
              Decide where you want to receive updates from customer {isResortBusiness ? 'bookings' : 'orders'} and
              chats.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-[#f0e7dc] px-4 py-3">
                <span className="text-sm text-[#4a433c]">
                  {isResortBusiness ? 'Booking updates via email' : 'Order updates via email'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.receiveOrderEmailAlerts}
                  onChange={() => updateBooleanSetting('receiveOrderEmailAlerts')}
                  className="h-4 w-4 accent-[#9b5a2c]"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[#f0e7dc] px-4 py-3">
                <span className="text-sm text-[#4a433c]">Chat message alerts</span>
                <input
                  type="checkbox"
                  checked={settings.receiveChatNotifications}
                  onChange={() => updateBooleanSetting('receiveChatNotifications')}
                  className="h-4 w-4 accent-[#9b5a2c]"
                />
              </label>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2f2a26]">
              {isResortBusiness ? 'Booking Defaults' : 'Order Defaults'}
            </h2>
            <p className="mt-1 text-sm text-[#6d645d]">
              Set your usual operating behavior so the team starts with sensible defaults.
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between rounded-xl border border-[#f0e7dc] px-4 py-3">
                <span className="text-sm text-[#4a433c]">
                  {isResortBusiness ? 'Auto-accept incoming bookings' : 'Auto-accept incoming orders'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.autoAcceptOrders}
                  onChange={() => updateBooleanSetting('autoAcceptOrders')}
                  className="h-4 w-4 accent-[#9b5a2c]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#4a433c]">
                  {isResortBusiness ? 'Default confirmation time' : 'Default preparation time'}
                </span>
                <select
                  value={settings.prepTimeMinutes}
                  onChange={(event) => updateSelectSetting('prepTimeMinutes', event.target.value)}
                  className="w-full rounded-xl border border-[#e7dfd5] bg-[#fffdf9] px-3 py-2 text-sm text-[#3f3a35] outline-none transition focus:border-[#d5c5b2]"
                >
                  <option value={10}>10 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </label>
            </div>
          </article>
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-[#f0dcc7] bg-[#fff9f3] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2f2a26]">Save Changes</h2>
            <p className="mt-1 text-sm text-[#6d645d]">
              Apply your current settings to this device and dashboard session.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isSavingSettings}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  hasUnsavedChanges && !isSavingSettings
                    ? 'bg-[#9b5a2c] text-white hover:bg-[#844a22]'
                    : 'cursor-not-allowed bg-[#e9ddd0] text-[#8a8179]'
                }`}
              >
                {isSavingSettings ? 'Saving...' : 'Save settings'}
              </button>
              <button
                type="button"
                onClick={resetToSaved}
                disabled={!hasUnsavedChanges || isSavingSettings}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  hasUnsavedChanges && !isSavingSettings
                    ? 'border-[#d9c9b6] bg-white text-[#6d645d] hover:bg-[#f8f5f0]'
                    : 'cursor-not-allowed border-[#eee5dc] bg-white text-[#b0a396]'
                }`}
              >
                Reset changes
              </button>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default Settings
