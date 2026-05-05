const SOCIAL_IN_APP_UA =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|LinkedInApp|Pinterest/i

export const isTrustedXenditCheckoutUrl = (raw) => {
  try {
    const u = new URL(String(raw || '').trim())
    if (u.protocol !== 'https:') {
      return false
    }
    const host = u.hostname.toLowerCase()
    return (
      host === 'checkout.xendit.co' ||
      host.endsWith('.xendit.co') ||
      host === 'invoice.xendit.co' ||
      host.endsWith('.xendit.net')
    )
  } catch {
    return false
  }
}

export const isLikelySocialInAppBrowser = () => {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false
  }
  return SOCIAL_IN_APP_UA.test(navigator.userAgent)
}

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

export const assignXenditCheckout = (checkoutUrl) => {
  const trimmed = String(checkoutUrl || '').trim()
  if (!isTrustedXenditCheckoutUrl(trimmed)) {
    throw new Error('Invalid checkout link.')
  }
  window.location.assign(trimmed)
}
