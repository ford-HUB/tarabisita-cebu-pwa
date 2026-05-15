const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const parseGeminiJson = (text) => {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end < 0 || end <= start) return null
    try {
      return JSON.parse(trimmed.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

/**
 * Ask Gemini to reorder catalog row indices by relevance to the user query.
 * @param {{ query: string, items: { name?: string, category?: string, businessName?: string }[] }} input
 * @returns {number[] | null} — 0-based indices into `items`, or null to keep client order
 */
export const rankTouristCatalogItemsWithGemini = async ({ query, items }) => {
  const apiKey = String(process.env.GEMINI_APIKEY || '').trim()
  const q = String(query || '').trim()
  const rows = Array.isArray(items) ? items : []
  if (!apiKey || !q || !rows.length) return null

  const lines = rows.map((row, i) => {
    const name = String(row?.name || '').slice(0, 140)
    const category = String(row?.category || '').slice(0, 80)
    const partner = String(row?.businessName || '').slice(0, 100)
    return `${i}: dish/package="${name}" | category="${category}" | partner="${partner}"`
  })

  const prompt = [
    'You assist a Cebu travel app catalog search.',
    'The user typed a search query. Below are candidate catalog lines (food, drinks, stay packages).',
    'Return ONLY strict JSON (no markdown) with shape: {"indices":[number,...]}',
    '',
    'Rules:',
    '- "indices" must list 0-based row numbers in best-match-first order for this query.',
    '- Use ONLY integers between 0 and ' + String(rows.length - 1) + ' inclusive.',
    '- Include each index at most once.',
    '- Omit rows that clearly do not match the user intent.',
    '- If uncertain but plausibly related, prefer including the row lower in the list.',
    '- Prefer semantic match (e.g. "seafood", "hotel", "breakfast", "Cebu") over literal substring.',
    '',
    `User query: ${q.slice(0, 220)}`,
    '',
    'Catalog rows:',
    ...lines
  ].join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    }
  )

  if (!response.ok) return null

  const payload = await response.json()
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const parsed = parseGeminiJson(rawText)
  const rawList = parsed && Array.isArray(parsed.indices) ? parsed.indices : []
  const n = rows.length
  const seen = new Set()
  const out = []
  for (const v of rawList) {
    const i = Math.round(Number(v))
    if (!Number.isFinite(i) || i < 0 || i >= n) continue
    if (seen.has(i)) continue
    seen.add(i)
    out.push(i)
  }
  return out.length ? out : null
}
