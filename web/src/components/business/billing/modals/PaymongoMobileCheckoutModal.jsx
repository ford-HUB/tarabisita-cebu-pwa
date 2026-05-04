import { FiX } from 'react-icons/fi'
import { copyTextToClipboard } from '../../../../shared/utils/paymongoCheckoutRedirect.utils'
import { toast } from 'sonner'

const PaymongoMobileCheckoutModal = ({
  isOpen,
  checkoutUrl = '',
  onClose,
  onContinueToPaymongo
}) => {
  if (!isOpen) {
    return null
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(checkoutUrl)
    if (ok) {
      toast.success('Payment link copied. Paste it in Safari or Chrome, then continue.')
    } else {
      toast.error('Could not copy. Long-press the “Continue to PayMongo” button and copy the link, or open this site in your phone’s browser.')
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paymongo-mobile-checkout-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#f0e8de] px-5 py-4">
          <div>
            <h2 id="paymongo-mobile-checkout-title" className="text-lg font-semibold text-[#2f2f2f]">
              Continue to GCash & other wallets
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6d645d]">
              You are in an in-app browser. PayMongo will show an <span className="font-medium text-[#2f2f2f]">Open in GCash</span>{' '}
              action so payment can finish in the GCash app, then return you here when done. These browsers often block
              that handoff — for the smoothest flow, open Tara Bisita in <span className="font-medium text-[#2f2f2f]">Safari</span> or{' '}
              <span className="font-medium text-[#2f2f2f]">Chrome</span> first, or copy the secure payment link below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-[#7e746b] transition hover:bg-[#f7f3ed] hover:text-[#2f2f2f]"
          >
            <FiX size={20} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-5 py-4">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-xl border border-[#e7dfd5] bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-[#2f2f2f] transition hover:bg-[#f3ece4]"
          >
            Copy secure payment link
          </button>
          <button
            type="button"
            onClick={onContinueToPaymongo}
            className="w-full rounded-xl bg-[#9b5a2c] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#844a24]"
          >
            Continue to PayMongo anyway
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-[#7e746b] transition hover:bg-[#f7f3ed] hover:text-[#2f2f2f]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymongoMobileCheckoutModal
