const EMPTY_DISPLAY = '—'

const phDateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export const formatBillingDateTime = (value) => {
  if (value == null || value === '') {
    return EMPTY_DISPLAY
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return EMPTY_DISPLAY
  }
  return phDateTimeFormatter.format(d)
}

export const formatBillingPeso = (amount) => {
  const n = Number(amount)
  if (amount == null || !Number.isFinite(n)) {
    return EMPTY_DISPLAY
  }
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

/**
 * Peso for jsPDF (Helvetica): avoid Intl currency output — the peso sign and narrow
 * no‑break space (U+202F) are not in PDF core fonts and often render as ± or garbled text.
 */
export const formatBillingPesoForPdf = (amount) => {
  const n = Number(amount)
  if (amount == null || !Number.isFinite(n)) {
    return EMPTY_DISPLAY
  }
  const formatted = n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `Php ${formatted}`
}

/** Compact UTC calendar line from ledger subscription `period` object. */
export const formatUtcPeriodLine = (period) => {
  if (!period?.start || !period?.end) {
    return EMPTY_DISPLAY
  }
  const fmt = (p) =>
    `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} UTC`
  return `${fmt(period.start)} → ${fmt(period.end)}`
}

const displayOrDash = (value) => {
  const text = value == null ? '' : String(value).trim()
  return text.length > 0 ? text : EMPTY_DISPLAY
}

/**
 * Rows for the Billing Info card (from GET business/me profile payload).
 */
export const getBillingAccountDisplayRows = (profile) => {
  if (!profile) {
    return []
  }

  const phone = profile.contact_info?.phone

  return [
    ['Owner name', displayOrDash(profile.ownerName)],
    ['Business name', displayOrDash(profile.name)],
    ['Address', displayOrDash(profile.address)],
    ['Phone', displayOrDash(phone)],
    ['Email', displayOrDash(profile.ownerEmail)],
    ['Website', displayOrDash(profile.website)]
  ]
}

/**
 * Seed values for the PayMongo-style billing modal from the same profile.
 */
export const mapProfileToBillingAddressFormDefaults = (profile) => ({
  name: profile?.ownerName?.trim() || '',
  street: profile?.address?.trim() || '',
  cityState: '',
  country: '',
  zipPostal: '',
  townCity: ''
})


export const buildUpdateProfilePayloadFromBillingForm = (profile, trimmed) => {
  if (!profile) {
    throw new Error('Profile is not loaded yet.')
  }

  const lat = Number(profile.businessLocation?.lat ?? profile.lat ?? 0)
  const lng = Number(profile.businessLocation?.lng ?? profile.lng ?? 0)

  const lineParts = [trimmed.street, trimmed.townCity, trimmed.cityState, trimmed.zipPostal, trimmed.country]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)

  const composedAddress =
    lineParts.length > 0 ? lineParts.join(', ') : String(trimmed.street ?? '').trim()

  return {
    ownerName: String(trimmed.name ?? '').trim(),
    businessName: String(profile.name ?? '').trim(),
    address: composedAddress,
    phone: String(profile.contact_info?.phone ?? '').trim(),
    about: String(profile.description ?? '').trim(),
    website: String(profile.website ?? '').trim(),
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0
  }
}
