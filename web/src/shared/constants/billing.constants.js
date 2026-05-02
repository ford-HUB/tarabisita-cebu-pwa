export const BILLING_PAYMENT_TOAST_DURATION_SECONDS = 5

export const billingPaymentReturnToastConfig = {
  success: {
    title: 'Payment successful',
    message: 'Your subscription is being activated.'
  },
  failure: {
    title: 'Payment failed',
    message: 'Please try again or use another payment method.'
  },
  cancelled: {
    title: 'Checkout cancelled',
    message: 'No payment was processed.'
  }
}
