const ITEM_NOTE_MARKER = ' — Item note: '

export const extractLineItemNotesFromProductDetails = (productDetails) => {
  if (!productDetails || typeof productDetails !== 'string') return []
  const out = []
  for (const line of productDetails.split('\n')) {
    const idx = line.indexOf(ITEM_NOTE_MARKER)
    if (idx === -1) continue
    const lineSummary = line.slice(0, idx).trim()
    const note = line.slice(idx + ITEM_NOTE_MARKER.length).trim()
    if (note) out.push({ lineSummary, note })
  }
  return out
}

export const orderHasCustomerNotes = (order) => {
  if (!order) return false
  if (String(order.notes || '').trim()) return true
  return extractLineItemNotesFromProductDetails(order.productDetails || '').length > 0
}


export const formatProductDetailsForOrderModal = (productDetails, orderNotes) => {
  if (!productDetails || typeof productDetails !== 'string') return ''
  const orderNoteTrim = String(orderNotes || '').trim()
  const lines = productDetails.split('\n').map((line) => {
    const idx = line.indexOf(ITEM_NOTE_MARKER)
    if (idx === -1) return line
    return line.slice(0, idx).trimEnd()
  })
  const filtered = lines.filter((line) => {
    if (!orderNoteTrim) return true
    const m = line.match(/^Notes:\s*(.*)$/)
    if (!m) return true
    return m[1].trim() !== orderNoteTrim
  })
  return filtered.join('\n')
}
