export const publicSearchHref = '/search'

/** @param {string} [query] */
export const buildPublicSearchHref = (query = '') => {
  const q = String(query || '').trim()
  if (!q) return publicSearchHref
  return `${publicSearchHref}?q=${encodeURIComponent(q)}`
}
