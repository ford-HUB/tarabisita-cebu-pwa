
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
const TOURIST_CHECKOUT_ROUTE = 'tourist/explore/checkout'

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
