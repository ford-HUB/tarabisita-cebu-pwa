/**
 * PayMongo hosted checkout (GCash, PayMaya, etc.). The wallet app is opened from
 * PayMongo’s page (e.g. “Open in GCash” → gcash://). Mobile Safari/Chrome handle that;
 * in-app browsers often block custom URL schemes — use {@link isLikelySocialInAppBrowser}.
 */

const SOCIAL_IN_APP_UA =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|LinkedInApp|Pinterest/i

/**
 * @param {string} raw
 * @returns {boolean}
 */
export const isTrustedPaymongoCheckoutUrl = (raw) => {
  try {
    const u = new URL(String(raw || '').trim())
    if (u.protocol !== 'https:') {
      return false
    }
    const host = u.hostname.toLowerCase()
    return host === 'checkout.paymongo.com' || host.endsWith('.paymongo.com')
  } catch {
    return false
  }
}

/**
 * Facebook / Instagram / Line / WeChat in-app browsers often block gcash:// from PayMongo’s UI.
 * @returns {boolean}
 */
export const isLikelySocialInAppBrowser = () => {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false
  }
  return SOCIAL_IN_APP_UA.test(navigator.userAgent)
}

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyTextToClipboard = async (text) => {
  const value = String(text || '')
  if (!value) {
    return false
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Top-level navigation to PayMongo checkout (required so wallet deep links work).
 * @param {string} checkoutUrl
 */
export const assignPaymongoCheckout = (checkoutUrl) => {
  const trimmed = String(checkoutUrl || '').trim()
  if (!isTrustedPaymongoCheckoutUrl(trimmed)) {
    throw new Error('Invalid PayMongo checkout link.')
  }
  window.location.assign(trimmed)
}
