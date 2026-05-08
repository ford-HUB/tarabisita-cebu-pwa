
const readFirstEnv = (keys = []) =>
    keys.map((key) => process.env[key]).find((value) => typeof value === 'string' && value.trim())?.trim() || ''

export const getRouteSigningPassphrase = () =>
    readFirstEnv(['ROLE_URL_CRYPTO_PASS', 'VITE_ROLE_URL_CRYPTO_PASS']) || 'tarabisita-role-key'

export const encryptRouteWithPass = (routeValue, passphrase) => {
    const safePassphrase = passphrase || getRouteSigningPassphrase()
    let encodedChars = ''
    for (let i = 0; i < routeValue.length; i += 1) {
        const passCode = safePassphrase.charCodeAt(i % safePassphrase.length)
        encodedChars += String.fromCharCode(routeValue.charCodeAt(i) ^ passCode)
    }
    return Buffer.from(encodedChars, 'latin1')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

const BUSINESS_BILLING_ROUTE = 'business/dashboard/billing'
const BUSINESS_PAYMENT_METHODS_ROUTE = 'business/dashboard/payment-methods'
const TOURIST_CHECKOUT_ROUTE = 'tourist/explore/checkout'
const TOURIST_BOOKING_PAYMENT_ROUTE = 'tourist/booking-payment'
const TOURIST_EXPLORE_ROUTE = 'tourist/explore'

export const buildSignedBusinessBillingReturnUrl = (clientBaseUrl, { payment, planId }) => {
    const base = String(clientBaseUrl || '').trim().replace(/\/+$/, '')
    if (!base || !/^https?:\/\//i.test(base)) {
        return ''
    }
    const rk = encryptRouteWithPass(BUSINESS_BILLING_ROUTE, getRouteSigningPassphrase())
    const url = new URL(`/${BUSINESS_BILLING_ROUTE}`, `${base}/`)
    url.searchParams.set('rk', rk)
    url.searchParams.set('payment', payment)
    if (planId) {
        url.searchParams.set('plan', String(planId))
    }
    return url.toString()
}

export const buildSignedBusinessPaymentMethodsReturnUrl = (clientBaseUrl, { payment, method }) => {
    const base = String(clientBaseUrl || '').trim().replace(/\/+$/, '')
    if (!base || !/^https?:\/\//i.test(base)) {
        return ''
    }
    const rk = encryptRouteWithPass(BUSINESS_PAYMENT_METHODS_ROUTE, getRouteSigningPassphrase())
    const url = new URL(`/${BUSINESS_PAYMENT_METHODS_ROUTE}`, `${base}/`)
    url.searchParams.set('rk', rk)
    if (payment) {
        url.searchParams.set('payment', String(payment))
    }
    if (method) {
        url.searchParams.set('method', String(method))
    }
    return url.toString()
}

/** PayMongo return URL for tourist menu prepayment (must match SPA path + rk signing). */
export const buildSignedTouristCheckoutReturnUrl = (clientBaseUrl, { payment, pendingCheckoutId }) => {
    const base = String(clientBaseUrl || '').trim().replace(/\/+$/, '')
    if (!base || !/^https?:\/\//i.test(base)) {
        return ''
    }
    const rk = encryptRouteWithPass(TOURIST_CHECKOUT_ROUTE, getRouteSigningPassphrase())
    const url = new URL(`/${TOURIST_CHECKOUT_ROUTE}`, `${base}/`)
    url.searchParams.set('rk', rk)
    url.searchParams.set('payment', payment)
    if (pendingCheckoutId) {
        url.searchParams.set('pending', String(pendingCheckoutId))
    }
    return url.toString()
}

export const buildSignedTouristBookingPaymentEntryUrl = (clientBaseUrl, { paymentToken }) => {
    const base = String(clientBaseUrl || '').trim().replace(/\/+$/, '')
    if (!base || !/^https?:\/\//i.test(base) || !paymentToken) {
        return ''
    }
    const rk = encryptRouteWithPass(TOURIST_BOOKING_PAYMENT_ROUTE, getRouteSigningPassphrase())
    const url = new URL(`/${TOURIST_BOOKING_PAYMENT_ROUTE}`, `${base}/`)
    url.searchParams.set('rk', rk)
    url.searchParams.set('t', String(paymentToken))
    return url.toString()
}

export const buildSignedTouristExploreReturnUrl = (clientBaseUrl, { payment } = {}) => {
    const base = String(clientBaseUrl || '').trim().replace(/\/+$/, '')
    if (!base || !/^https?:\/\//i.test(base)) {
        return ''
    }
    const rk = encryptRouteWithPass(TOURIST_EXPLORE_ROUTE, getRouteSigningPassphrase())
    const url = new URL(`/${TOURIST_EXPLORE_ROUTE}`, `${base}/`)
    url.searchParams.set('rk', rk)
    if (payment) {
        url.searchParams.set('payment', String(payment))
    }
    return url.toString()
}
