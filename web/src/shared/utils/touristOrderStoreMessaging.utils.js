/** Digits only for `wa.me` (include country code in stored number when possible). */
export const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '')

export const buildTelHref = (phone) => {
  const raw = String(phone ?? '').trim()
  if (!raw) return ''
  const compact = raw.replace(/[^\d+]/g, '')
  return compact ? `tel:${compact}` : ''
}

export const buildWebsiteHref = (website) => {
  const w = String(website ?? '').trim()
  if (!w) return ''
  return /^https?:\/\//i.test(w) ? w : `https://${w}`
}

/**
 * @param {{ email: string, subject: string, body: string }} p
 * @returns {string}
 */
export const buildMailtoHref = ({ email, subject, body }) => {
  const e = String(email ?? '').trim()
  if (!e) return ''
  const q = (s) => encodeURIComponent(String(s ?? ''))
  return `mailto:${e}?subject=${q(subject)}&body=${q(body)}`
}

/**
 * WhatsApp from dedicated field (number or https link) or fallback phone digits.
 * @param {{ whatsappRaw?: string, phoneRaw?: string, prefilledText: string }} p
 */
export const buildWhatsAppHref = ({ whatsappRaw, phoneRaw, prefilledText }) => {
  const w = String(whatsappRaw ?? '').trim()
  if (/^https?:\/\//i.test(w)) {
    if (/wa\.me\//i.test(w) && !/[?&]text=/i.test(w)) {
      const sep = w.includes('?') ? '&' : '?'
      return `${w}${sep}text=${encodeURIComponent(prefilledText)}`
    }
    return w
  }
  const fromWa = digitsOnly(w)
  const fromPhone = digitsOnly(phoneRaw)
  const num = fromWa || fromPhone
  if (!num) return ''
  return `https://wa.me/${num}?text=${encodeURIComponent(prefilledText)}`
}

/**
 * @param {{ businessName: string, orderCode: string, productTitle: string, customerName: string }} p
 */
export const buildOrderInquiryMailBody = ({ businessName, orderCode, productTitle, customerName }) =>
  [
    'Hello,',
    '',
    `I'm reaching out from Tara Bisita about my order.`,
    '',
    `Store: ${businessName}`,
    `Order code: ${orderCode}`,
    `Order: ${productTitle}`,
    customerName ? `My name: ${customerName}` : null,
    '',
    '[Write your message here]',
    '',
    'Thank you.'
  ]
    .filter(Boolean)
    .join('\n')

export const buildOrderInquiryMailSubject = ({ orderCode }) =>
  `Tara Bisita — question about order ${orderCode}`

export const buildWhatsAppPrefill = ({ businessName, orderCode, productTitle, customerName }) =>
  [
    `Hello! I'm messaging about my Tara Bisita order (${orderCode}) from ${businessName}.`,
    productTitle ? `Items: ${productTitle}.` : null,
    customerName ? `My name: ${customerName}.` : null,
    ''
  ]
    .filter(Boolean)
    .join(' ')
