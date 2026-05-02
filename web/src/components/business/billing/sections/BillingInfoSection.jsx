import { useState } from 'react'
import { FiEdit2 } from 'react-icons/fi'
import UpdateBillingAddressModal from '../modals/UpdateBillingAddressModal'

const BillingInfoSection = ({
  billingDisplayRows = [],
  billingAddressFormDefaults,
  isBillingProfileLoading = false,
  onBillingAddressSave
}) => {
  const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false)

  return (
    <>
      <article className="rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
        <header className="border-b border-[#f0e8de] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">Billing Info</h2>
          <p className="mt-1 text-xs text-[#9f9387]">Synced from your business profile and registration details.</p>
        </header>

        <div className="space-y-3 p-5 text-sm">
          {isBillingProfileLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`billing-skeleton-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-[#f5eee4] pb-2.5"
                >
                  <div className="h-3 w-24 animate-pulse rounded bg-[#efe7dc]" />
                  <div className="h-3 w-40 max-w-[55%] animate-pulse rounded bg-[#f5eee4]" />
                </div>
              ))}
            </div>
          ) : (
            billingDisplayRows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-[#f5eee4] pb-2.5">
                <span className="text-[#7e746b]">{label}</span>
                <span className="max-w-[65%] wrap-break-word text-right font-medium text-[#2f2f2f]">{value}</span>
              </div>
            ))
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setIsBillingAddressModalOpen(true)}
            disabled={isBillingProfileLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7dfd5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiEdit2 size={15} />
            Update Billing Address
          </button>
        </div>
      </article>

      <UpdateBillingAddressModal
        isOpen={isBillingAddressModalOpen}
        onClose={() => setIsBillingAddressModalOpen(false)}
        onSave={onBillingAddressSave}
        accountBillingDefaults={billingAddressFormDefaults}
      />
    </>
  )
}

export default BillingInfoSection
