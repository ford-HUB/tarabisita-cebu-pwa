/**
 * @param {string} title
 * @param {string} query
 * @returns {{ text: string, bold: boolean }[]}
 */
export const splitTitleForHighlight = (title, query) => {
  const raw = String(title || '')
  const q = String(query || '').trim()
  if (!q) return [{ text: raw, bold: false }]
  const lower = raw.toLowerCase()
  const qi = q.toLowerCase()
  const idx = lower.indexOf(qi)
  if (idx < 0) return [{ text: raw, bold: false }]
  const before = raw.slice(0, idx)
  const match = raw.slice(idx, idx + q.length)
  const after = raw.slice(idx + q.length)
  const parts = []
  if (before) parts.push({ text: before, bold: false })
  parts.push({ text: match, bold: true })
  if (after) parts.push({ text: after, bold: false })
  return parts.length ? parts : [{ text: raw, bold: false }]
}

/**
 * @param {unknown} item — menu feed row
 * @param {string} needle — lowercased trimmed query
 */
export const menuFeedItemMatchesQuery = (item, needle) => {
  if (!needle) return false
  const blob = [
    item?.name,
    item?.category,
    item?.businessName,
    item?.description,
    item?.notes,
    item?.partnerCategoryLabel
  ]
    .map((x) => String(x || '').toLowerCase())
    .join('\u0000')
  return blob.includes(needle)
}

/**
 * @param {unknown} item
 * @param {string} needle — lowercased trimmed query
 */
export const menuFeedItemTitleMatchesQuery = (item, needle) => {
  if (!needle) return false
  return String(item?.name || '')
    .toLowerCase()
    .includes(needle)
}
