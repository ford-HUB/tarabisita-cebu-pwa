/** Opens default mail client for admin warning / notice emails. */
export const buildWarningLetterMailto = (email) => {
  const trimmed = String(email || '').trim()
  if (!trimmed) return '#'
  const subject = encodeURIComponent('Regarding your TaraBisita account')
  const body = encodeURIComponent(
    'Dear user,\n\n\n\nIf you have questions, reply to this message.\n\n— TaraBisita support'
  )
  return `mailto:${encodeURIComponent(trimmed)}?subject=${subject}&body=${body}`
}
