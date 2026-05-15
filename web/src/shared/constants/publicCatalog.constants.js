export const publicSearchHref = '/search'

/** @param {string} [query] */
export const buildPublicSearchHref = (query = '') => {
  const q = String(query || '').trim()
  if (!q) return publicSearchHref
  return `${publicSearchHref}?q=${encodeURIComponent(q)}`
}

/** @param {string} businessId */
export const buildPublicBusinessDetailHref = (businessId) => {
  const id = String(businessId || '').trim()
  if (!id) return '/'
  return `/business/${encodeURIComponent(id)}`
}

/**
 * @param {string} businessId
 * @param {string} catalogItemId
 * @param {string} [editCartKey]
 */
export const buildPublicBusinessEditCartHref = (businessId, catalogItemId, editCartKey = '') => {
  const base = buildPublicBusinessDetailHref(businessId)
  const params = new URLSearchParams()
  const itemId = String(catalogItemId || '').trim()
  const key = String(editCartKey || '').trim()
  if (itemId) params.set('editMenuItem', itemId)
  if (key) params.set('editCartKey', key)
  const q = params.toString()
  return q ? `${base}?${q}` : base
}
