import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiCreditCard, FiSmartphone, FiXCircle } from 'react-icons/fi'
import { SiGrab } from 'react-icons/si'
import { toast } from 'sonner'
import { businessDashboardHref } from '../../../components/layout/business/businessLayout.constants'
import { useBusinessSettings } from '../../../hooks/useBusinessSettings.hook'
import PaymentPreferenceMark from '../../../components/tourist/checkout/PaymentPreferenceMark'
import { checkoutPaymentLogos } from '../../../components/business/profile/ui'

const METHOD_META = [
  { key: 'GCASH', label: 'GCash', hint: 'Mobile wallet payments', Icon: FiSmartphone },
  { key: 'MAYA', label: 'Maya', hint: 'Maya wallet and QR', Icon: FiSmartphone },
  { key: 'GRAB_PAY', label: 'GrabPay', hint: 'Grab e-wallet checkout', Icon: SiGrab },
  { key: 'CARD', label: 'Card', hint: 'Credit and debit cards', Icon: FiCreditCard }
]

const PaymentMethods = () => {
  const {
    settings,
    isLoadingSettings,
    isSavingSettings,
    isStartingPaymentMethodSetup,
    activeSetupMethodKey,
    hasUnsavedChanges,
    updatePaymentMethodToggle,
    startPaymentMethodSetupCheckout,
    loadSettings,
    saveSettings,
    resetToSaved
  } = useBusinessSettings()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    document.title = 'Payment Methods | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  useEffect(() => {
    const payment = String(searchParams.get('payment') || '').toLowerCase()
    const method = String(searchParams.get('method') || '').toUpperCase()
    if (!payment) return
    if (payment === 'success') {
      toast.success(method ? `${method} verified successfully.` : 'Payment method verified successfully.')
      void loadSettings()
    } else if (payment === 'cancelled') {
      toast.message(method ? `${method} setup was cancelled.` : 'Payment method setup was cancelled.')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    next.delete('method')
    setSearchParams(next, { replace: true })
  }, [loadSettings, searchParams, setSearchParams])

  const handleConfigure = async (methodKey) => {
    const result = await startPaymentMethodSetupCheckout(methodKey)
    if (!result?.ok || !result.checkoutUrl) return
    window.location.assign(result.checkoutUrl)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Payment Methods</h1>
          <p className="mt-0.5 text-sm text-[#6d645d]">
            Select the payment options you accept and add account credentials for your team and customers.
          </p>
        </div>
        <nav className="text-xs text-[#8a8179]" aria-label="Breadcrumb">
          <Link to={businessDashboardHref} className="font-medium text-[#9b5a2c] hover:underline">
            Home
          </Link>
          <span className="mx-1.5 text-[#c4b5a8]">/</span>
          <span className="text-[#4a433c]">Payment Methods</span>
        </nav>
      </div>

      {isLoadingSettings ? (
        <div className="rounded-2xl border border-[#e7dfd5] bg-white p-5 text-sm text-[#6d645d] shadow-sm">
          Loading payment methods...
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {METHOD_META.map((method) => {
            const row = settings?.paymentMethods?.[method.key] || {}
            const enabled = row?.enabled === true
            const isVerified = Boolean(row?.isVerified)
            const Icon = method.Icon
            const isMethodLoading = isStartingPaymentMethodSetup && activeSetupMethodKey === method.key
            return (
              <article
                key={method.key}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  enabled ? 'border-[#e7dfd5]' : 'border-[#eee3d9] opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#efe6dc] bg-[#fff8f2] text-[#9b5a2c]">
                      <PaymentPreferenceMark
                        option={{ Icon }}
                        iconSrc={checkoutPaymentLogos?.[method.key]}
                      />
                    </span>
                    <h2 className="text-lg font-semibold text-[#2f2a26]">{method.label}</h2>
                    <p className="mt-1 text-sm text-[#6d645d]">{method.hint}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#9a7e67]">
                          <FiXCircle className="h-3.5 w-3.5" />
                          Not verified
                        </span>
                      )}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd5] bg-[#fffaf4] px-3 py-1.5 text-sm text-[#4a433c]">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => updatePaymentMethodToggle(method.key)}
                      className="h-4 w-4 accent-[#9b5a2c]"
                    />
                    Enabled
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleConfigure(method.key)}
                  disabled={isStartingPaymentMethodSetup}
                  className="mt-4 rounded-xl border border-[#d9c9b6] bg-white px-4 py-2 text-sm font-medium text-[#6d645d] transition hover:bg-[#f8f5f0] disabled:cursor-not-allowed disabled:border-[#eee5dc] disabled:text-[#b0a396]"
                >
                  {isMethodLoading ? 'Opening Xendit...' : 'Configure'}
                </button>
              </article>
            )
          })}
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-[#f0dcc7] bg-[#fff9f3] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2f2a26]">Save Changes</h2>
            <p className="mt-1 text-sm text-[#6d645d]">Enabled methods appear in tourist checkout only after verification.</p>
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
                {isSavingSettings ? 'Saving...' : 'Save payment methods'}
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

export default PaymentMethods
