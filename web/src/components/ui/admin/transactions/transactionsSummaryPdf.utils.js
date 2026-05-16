import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatBillingDateTime, formatBillingPesoForPdf } from '../../../../shared/utils/billingDisplay.utils'
import { computeTransactionSummaryMetrics } from './transactions.utils'
import { normalizeTransactionDisplayStatus } from './transactions.constants'

/** TaraBisita palette — aligned with `/logo.png` and app orange accents (#ff7a1a). */
const BRAND = {
  orange: [255, 122, 26],
  orangeDark: [235, 108, 18],
  orangeDeep: [198, 107, 43],
  cream: [255, 248, 242],
  paper: [252, 250, 247],
  ink: [31, 31, 31],
  muted: [93, 85, 78],
  accent: [255, 122, 26],
  rule: [255, 212, 188]
}

const LOGO_MM = 16

const MM = { left: 16, right: 16, top: 14, bottom: 18 }

const formatGeneratedLine = (date) =>
  date.toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' })

/**
 * Rasterize `/logo.png` for jsPDF (PNG). Returns null if loading or canvas fails.
 */
const loadBrandLogoPng = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve(null)
      return
    }
    const path = `${(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}logo.png`
    const src = path.startsWith('http') ? path : new URL(path, window.location.origin).href
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const maxSide = 128
        const scale = Math.min(maxSide / img.naturalWidth, maxSide / img.naturalHeight, 1)
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })

const drawPageFooters = (doc) => {
  const total = doc.getNumberOfPages()
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...BRAND.rule)
    doc.setLineWidth(0.2)
    doc.line(MM.left, ph - 12, pw - MM.right, ph - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.muted)
    doc.text('TaraBisita · Tara - Bisita Cebu · Admin', MM.left, ph - 7)
    doc.text(`Page ${i} of ${total}`, pw - MM.right, ph - 7, { align: 'right' })
  }
}

/**
 * Builds and triggers download of a branded PDF summary (logo, filters, totals, line items).
 */
export const downloadPlanSubscriptionTransactionsSummaryPdf = async ({
  rows,
  periodLabel,
  statusFilterLabel,
  searchQuery,
  scopeDescription,
  generatedAt = new Date()
}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pw = doc.internal.pageSize.getWidth()
  /** Usable width inside left/right margins — all tables stretch to this. */
  const innerW = Number((pw - MM.left - MM.right).toFixed(2))
  let y = MM.top

  const logoDataUrl = await loadBrandLogoPng()
  const headerTextX = logoDataUrl ? MM.left + LOGO_MM + 4 : MM.left
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MM.left, y, LOGO_MM, LOGO_MM)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...BRAND.orangeDeep)
  doc.text('TaraBisita', headerTextX, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.muted)
  doc.text('Admin · Plan subscription transactions', headerTextX, y + 11)

  doc.setFontSize(8)
  doc.setTextColor(...BRAND.accent)
  const tag = 'Subscription billing intelligence'
  doc.text(tag, pw - MM.right, y + 6, { align: 'right' })

  y += 20
  doc.setDrawColor(...BRAND.orange)
  doc.setLineWidth(0.6)
  doc.line(MM.left, y, pw - MM.right, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...BRAND.ink)
  doc.text('Transaction summary report', MM.left, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.muted)
  doc.text(`Report generated: ${formatGeneratedLine(generatedAt)}`, MM.left, y)
  y += 10

  const q = String(searchQuery || '').trim()
  const detailRows = [
    ['Report scope', scopeDescription || '—'],
    ['Date range filter', periodLabel ?? '—'],
    ['Payment status filter', statusFilterLabel ?? '—'],
    ...(q ? [['Search filter', q]] : []),
    ['Rows in this report', String(rows.length)]
  ]

  const reportLabelW = Number((innerW * 0.34).toFixed(2))
  const reportValueW = Number((innerW - reportLabelW).toFixed(2))
  autoTable(doc, {
    startY: y,
    tableWidth: innerW,
    head: [['Report details', '']],
    body: detailRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: BRAND.ink },
    headStyles: {
      fillColor: BRAND.orange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: reportLabelW, fontStyle: 'bold', textColor: BRAND.muted },
      1: { cellWidth: reportValueW }
    },
    margin: { left: MM.left, right: MM.right },
    tableLineColor: BRAND.rule,
    tableLineWidth: 0.1
  })

  y = doc.lastAutoTable.finalY + 8

  const metrics = computeTransactionSummaryMetrics(rows)
  const statusRows = Object.keys(metrics.byStatus)
    .sort()
    .map((status) => [
      status,
      String(metrics.byStatus[status]),
      formatBillingPesoForPdf(metrics.amountByStatus[status] || 0)
    ])

  const totalsBody = [
    ['Transactions listed', String(metrics.rowCount)],
    ['Grand total (all rows above)', formatBillingPesoForPdf(metrics.totalAmount)],
    ['Revenue recognized (paid only)', formatBillingPesoForPdf(metrics.paidAmount)]
  ]

  const totalsLabelW = Number((innerW * 0.5).toFixed(2))
  const totalsValueW = Number((innerW - totalsLabelW).toFixed(2))
  autoTable(doc, {
    startY: y,
    tableWidth: innerW,
    head: [['Totals & calculation', 'Value']],
    body: totalsBody,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2.8, textColor: BRAND.ink },
    alternateRowStyles: { fillColor: BRAND.cream },
    headStyles: {
      fillColor: BRAND.orange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: totalsLabelW, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: totalsValueW, halign: 'right', fontStyle: 'normal' }
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 1) {
        data.cell.styles.halign = 'right'
      }
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.halign = 'right'
      }
    },
    margin: { left: MM.left, right: MM.right }
  })

  y = doc.lastAutoTable.finalY + 8

  const statusThird = Number((innerW / 3).toFixed(2))
  const statusW0 = statusThird
  const statusW1 = statusThird
  const statusW2 = Number((innerW - statusW0 - statusW1).toFixed(2))
  autoTable(doc, {
    startY: y,
    tableWidth: innerW,
    head: [['Status', 'Count', 'Amount sum']],
    body: statusRows.length ? statusRows : [['—', '0', formatBillingPesoForPdf(0)]],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: BRAND.ink },
    alternateRowStyles: { fillColor: BRAND.paper },
    headStyles: {
      fillColor: BRAND.orangeDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: statusW0, halign: 'left' },
      1: { cellWidth: statusW1, halign: 'center' },
      2: { cellWidth: statusW2, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section !== 'head') return
      if (data.column.index === 1) data.cell.styles.halign = 'center'
      if (data.column.index === 2) data.cell.styles.halign = 'right'
    },
    margin: { left: MM.left, right: MM.right, bottom: MM.bottom }
  })

  y = doc.lastAutoTable.finalY + 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...BRAND.ink)
  doc.text('Transaction details', MM.left, y)
  y += 8

  const lineItems = rows.map((row) => {
    const planParts = [row.planId ? String(row.planId) : '', row.months != null ? `${row.months} mo` : ''].filter(
      Boolean
    )
    const planCell = planParts.length ? planParts.join(' · ') : '—'
    return [
      String(row.orderId || '—'),
      String(row.businessName || '—'),
      String(row.customerName || '—'),
      planCell,
      String(row.email || '—'),
      formatBillingPesoForPdf(row.amount),
      normalizeTransactionDisplayStatus(row.status) || '—',
      formatBillingDateTime(row.createdAt)
    ]
  })

  const detailCols = 8
  const detailBase = Math.floor((innerW * 100) / detailCols) / 100
  const detailWidths = Array.from({ length: detailCols }, () => detailBase)
  const detailRemainder = Number((innerW - detailBase * detailCols).toFixed(2))
  detailWidths[detailCols - 1] = Number((detailBase + detailRemainder).toFixed(2))
  autoTable(doc, {
    startY: y,
    tableWidth: innerW,
    head: [['Order ID', 'Business', 'Owner', 'Plan', 'Email', 'Amount', 'Status', 'Created']],
    body: lineItems,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: BRAND.ink, overflow: 'linebreak' },
    headStyles: {
      fillColor: BRAND.orange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    alternateRowStyles: { fillColor: BRAND.cream },
    columnStyles: {
      0: { cellWidth: detailWidths[0] },
      1: { cellWidth: detailWidths[1] },
      2: { cellWidth: detailWidths[2] },
      3: { cellWidth: detailWidths[3] },
      4: { cellWidth: detailWidths[4] },
      5: { cellWidth: detailWidths[5], halign: 'right' },
      6: { cellWidth: detailWidths[6], halign: 'center' },
      7: { cellWidth: detailWidths[7] }
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 5) {
        data.cell.styles.halign = 'right'
      }
    },
    margin: { left: MM.left, right: MM.right, bottom: MM.bottom }
  })

  drawPageFooters(doc)

  const stamp = generatedAt.toISOString().slice(0, 10)
  doc.save(`tara-bisita-transaction-summary-${stamp}.pdf`)
}
