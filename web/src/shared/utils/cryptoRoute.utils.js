export const encryptRouteWithPass = (routeValue, passphrase) => {
  const safePassphrase = passphrase || 'tarabisita-role-key'

  const encodedChars = routeValue
    .split('')
    .map((char, index) => {
      const passCode = safePassphrase.charCodeAt(index % safePassphrase.length)
      return String.fromCharCode(char.charCodeAt(0) ^ passCode)
    })
    .join('')

  return btoa(encodedChars)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export const decryptRouteWithPass = (encodedValue, passphrase) => {
  const safePassphrase = passphrase || 'tarabisita-role-key'
  if (!encodedValue || typeof encodedValue !== 'string') return ''

  const normalizedEncodedValue = encodedValue.replace(/-/g, '+').replace(/_/g, '/')
  const paddedEncodedValue = normalizedEncodedValue.padEnd(
    normalizedEncodedValue.length + ((4 - (normalizedEncodedValue.length % 4)) % 4),
    '='
  )

  try {
    const decodedChars = atob(paddedEncodedValue)
      .split('')
      .map((char, index) => {
        const passCode = safePassphrase.charCodeAt(index % safePassphrase.length)
        return String.fromCharCode(char.charCodeAt(0) ^ passCode)
      })
      .join('')

    return decodedChars
  } catch {
    return ''
  }
}
