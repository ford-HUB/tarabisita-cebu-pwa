import Business from '../models/business.model.js'
import CustomerOrder from '../customer-orders/models/customer-order.model.js'

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const supportsPublicMenuCatalog = (business) => {
  const category =
    typeof business?.category === 'object' && business?.category?.name != null
      ? String(business.category.name).trim().toUpperCase()
      : String(business?.category || '').trim().toUpperCase()
  return category === 'RESTAURANT'
}

const resolveManilaDateLabel = (dateInput) => {
  const parsed = String(dateInput || '').trim()
  if (parsed && /^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

const resolveManilaRange = (dateInput) => {
  const day = resolveManilaDateLabel(dateInput)
  const startAt = new Date(`${day}T00:00:00.000+08:00`)
  const endAt = new Date(`${day}T23:59:59.999+08:00`)
  return { day, startAt, endAt }
}

const php = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0)

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

const buildFallbackAnalysis = ({ summary }) => ({
  executiveSummary: `Sales for ${summary.reportDate} reached ${php(summary.grossSales)} across ${summary.totalOrders} order(s).`,
  strengths: [
    `Completed orders: ${summary.completedOrders}`,
    `Average order value: ${php(summary.averageOrderValue)}`
  ],
  risks: summary.canceledOrders > 0 ? [`Canceled orders recorded: ${summary.canceledOrders}`] : ['No major risks detected.'],
  recommendations: [
    'Monitor hourly demand and adjust prep staffing during peak periods.',
    'Promote best-selling menu items to improve conversion.'
  ],
  legalComplianceNotes: [
    'This report is system-generated and intended for internal business decision support.',
    'Verify figures against official accounting and tax records before external filing.'
  ]
})

const createGeminiAnalysis = async ({ businessName, summary, topItems }) => {
  const apiKey = String(process.env.GEMINI_APIKEY || '').trim()
  if (!apiKey) {
    return buildFallbackAnalysis({ summary })
  }

  const prompt = [
    'You are a compliance-aware retail analyst.',
    'Generate a concise DAILY SALES REPORT analysis in strict JSON.',
    'Return ONLY JSON and no markdown.',
    '',
    'Required JSON shape:',
    '{',
    '  "executiveSummary": "string",',
    '  "strengths": ["string"],',
    '  "risks": ["string"],',
    '  "recommendations": ["string"],',
    '  "legalComplianceNotes": ["string"]',
    '}',
    '',
    'Constraints:',
    '- Keep each list to 2-4 bullets.',
    '- Do not invent numbers.',
    '- Mention this is not legal/tax advice in legalComplianceNotes.',
    '',
    `Business: ${businessName}`,
    `Report date (Asia/Manila): ${summary.reportDate}`,
    `Gross sales (PHP): ${summary.grossSales}`,
    `Completed orders: ${summary.completedOrders}`,
    `Canceled orders: ${summary.canceledOrders}`,
    `Total orders: ${summary.totalOrders}`,
    `Average order value (PHP): ${summary.averageOrderValue}`,
    `Top items: ${topItems.map((item) => `${item.itemName} (${item.quantitySold})`).join(', ') || 'None'}`
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
          temperature: 0.3
        }
      })
    }
  )

  if (!response.ok) {
    return buildFallbackAnalysis({ summary })
  }

  const payload = await response.json()
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const parsed = parseGeminiJson(rawText)
  if (!parsed || typeof parsed !== 'object') {
    return buildFallbackAnalysis({ summary })
  }

  return {
    executiveSummary:
      String(parsed.executiveSummary || '').trim() ||
      `Sales for ${summary.reportDate} reached ${php(summary.grossSales)}.`,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((v) => String(v)) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map((v) => String(v)) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map((v) => String(v)) : [],
    legalComplianceNotes: Array.isArray(parsed.legalComplianceNotes)
      ? parsed.legalComplianceNotes.map((v) => String(v))
      : []
  }
}

const mapTopItems = (orders) => {
  const tally = new Map()
  for (const order of orders) {
    const lines = Array.isArray(order.lineItems) ? order.lineItems : []
    if (lines.length === 0) {
      const key = String(order.productName || 'Unspecified item').trim() || 'Unspecified item'
      tally.set(key, (tally.get(key) || 0) + Math.max(1, Number(order.itemsCount) || 1))
      continue
    }
    for (const line of lines) {
      const key = String(line?.name || line?.menuItemId || 'Unspecified item').trim() || 'Unspecified item'
      tally.set(key, (tally.get(key) || 0) + Math.max(1, Number(line?.qty) || 1))
    }
  }
  return [...tally.entries()]
    .map(([itemName, quantitySold]) => ({ itemName, quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5)
}

export const generateMyDailySalesReportByUserId = async (userId, reportDate) => {
  const business = await Business.findOne({ userId }).populate('category', 'name').lean()
  if (!business) throw new Error('BUSINESS_NOT_FOUND')
  if (!supportsPublicMenuCatalog(business)) throw new Error('MENU_ORDERS_NOT_AVAILABLE')

  const { day, startAt, endAt } = resolveManilaRange(reportDate)
  const allOrders = await CustomerOrder.find({
    businessId: business._id,
    createdAt: { $gte: startAt, $lte: endAt }
  }).lean()

  const completedOrders = allOrders.filter((order) => order.status === 'FINISHED')
  const canceledOrders = allOrders.filter((order) => order.status === 'CANCELED')

  const grossSales = completedOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
  const totalCompletedItems = completedOrders.reduce((sum, order) => sum + (Number(order.itemsCount) || 0), 0)
  const averageOrderValue = completedOrders.length > 0 ? grossSales / completedOrders.length : 0
  const topItems = mapTopItems(completedOrders)

  const summary = {
    reportDate: day,
    grossSales: Number(grossSales.toFixed(2)),
    totalOrders: allOrders.length,
    completedOrders: completedOrders.length,
    canceledOrders: canceledOrders.length,
    totalItemsSold: totalCompletedItems,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    currency: 'PHP'
  }

  const analysis = await createGeminiAnalysis({
    businessName: business.name || 'Business',
    summary,
    topItems
  })

  return {
    business: {
      id: String(business._id),
      name: business.name || 'Business'
    },
    summary,
    topItems,
    analysis,
    generatedAt: new Date().toISOString(),
    legalNotice:
      'This report is generated for internal business monitoring. Validate all figures against official accounting records before regulatory filing.'
  }
}
