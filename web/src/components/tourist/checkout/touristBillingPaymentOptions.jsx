import { FiCreditCard, FiMapPin, FiSmartphone } from 'react-icons/fi'
import { MdAccountBalance } from 'react-icons/md'
import { SiGrab } from 'react-icons/si'

/** Menu checkout: each option opens PayMongo with only that payment method. */
export const TOURIST_MENU_CHECKOUT_PAYMENT_OPTIONS = [
  {
    value: 'GCASH',
    label: 'GCash',
    description: 'App or QR',
    Icon: FiSmartphone,
    iconWrapClass: 'border border-[#e3e8ec] bg-white'
  },
  {
    value: 'MAYA',
    label: 'Maya',
    description: 'Maya wallet',
    Icon: FiSmartphone,
    iconWrapClass: 'border border-[#e3e8ec] bg-[#f0f7ff]'
  },
  {
    value: 'GRAB_PAY',
    label: 'GrabPay',
    description: 'GrabPay wallet',
    Icon: SiGrab,
    iconWrapClass: 'border border-[#e3e8ec] bg-[#f3faf4]'
  },
  {
    value: 'CARD',
    label: 'Card',
    description: 'Visa, Mastercard',
    Icon: FiCreditCard,
    iconWrapClass: 'bg-violet-100 text-violet-900'
  }
]

export const BILLING_PAYMENT_OPTIONS = [
  {
    value: 'PAY_AT_PICKUP',
    label: 'Pay at pickup / dine-in',
    description: 'Cash or terminal when you arrive.',
    Icon: FiMapPin,
    iconWrapClass: 'bg-amber-100 text-amber-900'
  },
  {
    value: 'GCASH',
    label: 'GCash',
    description: 'Send to the restaurant’s GCash number.',
    Icon: FiSmartphone,
    iconWrapClass: 'border border-[#e3e8ec] bg-white'
  },
  {
    value: 'MAYA',
    label: 'Maya',
    description: 'Pay with your Maya wallet.',
    Icon: FiSmartphone,
    iconWrapClass: 'border border-[#e3e8ec] bg-white'
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Bank transfer',
    description: 'Deposit or online transfer.',
    Icon: MdAccountBalance,
    iconWrapClass: 'bg-slate-100 text-slate-800'
  },
  {
    value: 'CARD',
    label: 'Card',
    description: 'Credit or debit when supported.',
    Icon: FiCreditCard,
    iconWrapClass: 'bg-violet-100 text-violet-900'
  }
]
