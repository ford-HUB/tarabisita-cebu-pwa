import { menuFeedItemMatchesQuery } from './touristSearchHighlight.utils.js'

/**
 * Score how well `label` matches user `query` (both lowercased for contains checks).
 * @param {string} label
 * @param {string} queryLower
 */
const scoreLabelMatch = (label, queryLower) => {
  const L = String(label || '')
    .trim()
    .toLowerCase()
  if (!L || !queryLower) return -1
  if (L === queryLower) return 220
  if (L.startsWith(queryLower)) return 180
  const idx = L.indexOf(queryLower)
  if (idx === 0) return 160
  if (idx > 0) return 120 - Math.min(40, idx)
  const words = L.split(/\s+/).filter(Boolean)
  const wordStarts = words.some((w) => w.startsWith(queryLower))
  if (wordStarts) return 90
  if (L.includes(queryLower)) return 70
  return -1
}

/**
 * Suggest phrases that are guaranteed to match at least one catalog row
 * when used as the search needle (same rules as results filtering).
 *
 * @param {string} rawQuery
 * @param {unknown[]} catalogItems
 * @param {{ limit?: number, minQueryLength?: number }} [opts]
 * @returns {string[]}
 */
export const rankCatalogSearchSuggestions = (rawQuery, catalogItems, opts = {}) => {
  const limit = opts.limit ?? 8
  const minLen = opts.minQueryLength ?? 1
  const q = String(rawQuery || '').trim().toLowerCase()
  const items = Array.isArray(catalogItems) ? catalogItems : []
  if (!q || q.length < minLen || !items.length) return []

  const rows = []
  const seen = new Set()

  for (const item of items) {
    if (!menuFeedItemMatchesQuery(item, q)) continue
    const name = String(item?.name || '').trim()
    const category = String(item?.category || '').trim()
    const businessName = String(item?.businessName || '').trim()

    const push = (label) => {
      const t = String(label || '').trim()
      if (t.length < 2) return
      const key = t.toLowerCase()
      if (seen.has(key)) return
      const needle = key
      if (!items.some((it) => menuFeedItemMatchesQuery(it, needle))) return
      const sc = scoreLabelMatch(t, q)
      if (sc < 0) return
      seen.add(key)
      rows.push({ label: t, score: sc })
    }

    push(name)
    push(category)
    push(businessName)
  }

  rows.sort((a, b) => b.score - a.score || a.label.length - b.label.length)
  return rows.slice(0, limit).map((r) => r.label)
}

/**
 * Short chips for empty-query discovery (categories + sample partners from catalog).
 * Each chip matches at least one item when searched.
 *
 * @param {unknown[]} catalogItems
 * @param {{ limit?: number }} [opts]
 * @returns {string[]}
 */
export const getTrendingSearchChips = (catalogItems, opts = {}) => {
  const limit = opts.limit ?? 6
  const items = Array.isArray(catalogItems) ? catalogItems : []
  if (!items.length) return []

  const catCounts = new Map()
  for (const it of items) {
    const c = String(it?.category || '').trim()
    if (c) catCounts.set(c, (catCounts.get(c) || 0) + 1)
  }
  const cats = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, 4)

  const bizSeen = new Set()
  const biz = []
  for (const it of items) {
    const b = String(it?.businessName || '').trim()
    if (!b) continue
    const k = b.toLowerCase()
    if (bizSeen.has(k)) continue
    bizSeen.add(k)
    biz.push(b)
    if (biz.length >= 3) break
  }

  const out = []
  const seen = new Set()
  const add = (label) => {
    const t = String(label || '').trim()
    if (!t) return
    const key = t.toLowerCase()
    if (seen.has(key)) return
    if (!items.some((it) => menuFeedItemMatchesQuery(it, key))) return
    seen.add(key)
    out.push(t)
  }

  for (const x of [...cats, ...biz]) {
    add(x)
    if (out.length >= limit) break
  }
  return out
}

/**
 * Reorder the first `headSize` rows using Gemini-returned 0-based indices; append the rest unchanged.
 * @param {unknown[]} items
 * @param {number[]} indices
 * @param {{ headSize?: number }} [opts]
 */
export const applyGeminiRankOrder = (items, indices, opts = {}) => {
  const headSize = opts.headSize ?? 100
  const list = Array.isArray(items) ? items : []
  const idxs = Array.isArray(indices) ? indices : []
  if (!list.length || !idxs.length) return list
  const headLen = Math.min(headSize, list.length)
  const head = list.slice(0, headLen)
  const tail = list.slice(headLen)
  const n = head.length
  const used = new Set()
  const out = []
  for (const v of idxs) {
    const i = Math.round(Number(v))
    if (!Number.isFinite(i) || i < 0 || i >= n) continue
    if (used.has(i)) continue
    used.add(i)
    out.push(head[i])
  }
  for (let j = 0; j < n; j += 1) {
    if (!used.has(j)) out.push(head[j])
  }
  return [...out, ...tail]
}
