import { useMemo } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useBusinessDailySalesReport } from '../../../hooks/useBusinessDailySalesReport.hook.js'

const php = (value) => {
  const amount = Number(value) || 0
  return `PHP ${amount.toFixed(2)}`
}

const LegalBulletList = ({ title, items }) => (
  <section className="space-y-2 rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
    <h3 className="text-sm font-semibold text-[#6b4a2f]">{title}</h3>
    <ul className="list-disc space-y-1 pl-5 text-sm text-[#5d5650]">
      {(items || []).map((item) => (
        <li key={`${title}-${item}`}>{item}</li>
      ))}
    </ul>
  </section>
)

const DailySales = () => {
  const { report, selectedDate, setSelectedDate, isLoading, errorMessage, refreshReport, topItems } =
    useBusinessDailySalesReport()

  const summary = report?.summary || null
  const analysis = report?.analysis || null
  const isBookingReport = report?.reportBasis === 'bookings'
  const unitLabel = isBookingReport ? 'Booking' : 'Order'
  const unitLabelPlural = `${unitLabel}s`
  const topSectionTitle = isBookingReport ? 'Top Booking Lines Today' : 'Top Items Today'

  const generatedLabel = useMemo(() => {
    if (!report?.generatedAt) return ''
    const date = new Date(report.generatedAt)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
  }, [report?.generatedAt])

  const handleDownloadPdf = () => {
    if (!report || !summary) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    doc.setFontSize(16)
    doc.text(isBookingReport ? 'Daily Booking Earnings Report' : 'Daily Sales Report', 40, 48)
    doc.setFontSize(11)
    doc.text(`Business: ${report?.business?.name || 'Business'}`, 40, 68)
    doc.text(`Report Date: ${summary.reportDate}`, 40, 84)
    doc.text(`Generated At: ${generatedLabel || report.generatedAt}`, 40, 100)

    autoTable(doc, {
      startY: 120,
      head: [['Metric', 'Value']],
      body: [
        ['Gross Sales', php(summary.grossSales)],
        [`Total ${unitLabelPlural}`, String(summary.totalOrders || 0)],
        [`Completed ${unitLabelPlural}`, String(summary.completedOrders || 0)],
        [`Canceled ${unitLabelPlural}`, String(summary.canceledOrders || 0)],
        [isBookingReport ? 'Total Booking Entries' : 'Items Sold', String(summary.totalItemsSold || 0)],
        [`Average ${unitLabel} Value`, php(summary.averageOrderValue)]
      ],
      styles: { fontSize: 10 }
    })

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 120) + 20,
      head: [[isBookingReport ? 'Top Booking Lines' : 'Top Menu Items', 'Quantity']],
      body: topItems.length
        ? topItems.map((item) => [item.itemName || 'Item', String(item.quantitySold || 0)])
        : [[isBookingReport ? 'No completed bookings' : 'No completed menu sales', '0']],
      styles: { fontSize: 10 }
    })

    const nextY = (doc.lastAutoTable?.finalY || 200) + 22
    doc.setFontSize(11)
    doc.text('Executive Summary', 40, nextY)
    doc.setFontSize(10)
    doc.text(String(analysis?.executiveSummary || ''), 40, nextY + 16, { maxWidth: 510 })

    const legalStartY = nextY + 80
    doc.setFontSize(11)
    doc.text('Legal and Compliance Notes', 40, legalStartY)
    doc.setFontSize(10)
    const legalText = [
      ...(Array.isArray(analysis?.legalComplianceNotes) ? analysis.legalComplianceNotes : []),
      report?.legalNotice || ''
    ]
      .filter(Boolean)
      .map((line, index) => `${index + 1}. ${line}`)
      .join('\n')
    doc.text(legalText || 'No legal note provided.', 40, legalStartY + 16, { maxWidth: 510 })

    const safeBusinessName = String(report?.business?.name || 'business')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
    doc.save(`daily-sales-report-${safeBusinessName}-${summary.reportDate}.pdf`)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Daily Sales</h1>
          <p className="mt-1 text-sm text-[#6d645d]">
            AI-assisted daily {isBookingReport ? 'booking earnings' : 'sales'} analysis auto-generates for the selected
            date, with downloadable PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!report || isLoading}
          className="rounded-lg bg-[#9b5a2c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7d4622] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Download PDF
        </button>
      </div>

      <div className="rounded-2xl border border-[#ece3d9] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-1 text-sm text-[#4a4037]">
              <span className="font-semibold">Report date (Asia/Manila)</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="block min-w-[210px] rounded-lg border border-[#eadfce] px-3 py-2 text-sm focus:border-[#c98e5f] focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={refreshReport}
              className="h-[42px] rounded-lg border border-[#eadfce] px-4 py-2 text-sm font-semibold text-[#6d645d] transition hover:bg-[#f7f3ed]"
            >
              Regenerate Report
            </button>
          </div>
          <div className="md:pb-2">
            {generatedLabel ? (
              <p className="text-xs text-[#8a8179] md:text-right">Generated: {generatedLabel}</p>
            ) : (
              <p className="text-xs text-[#b0a396] md:text-right">Generated timestamp will appear here.</p>
            )}
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-[#7a7168]">Generating analysis...</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-[#b42318]">{errorMessage}</p> : null}

        {summary ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Gross Sales</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{php(summary.grossSales)}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Completed {unitLabelPlural}</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{summary.completedOrders || 0}</p>
              </article>
              <article className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
                <p className="text-xs text-[#8a8179]">Average {unitLabel} Value</p>
                <p className="mt-1 text-lg font-semibold text-[#2f2f2f]">{php(summary.averageOrderValue)}</p>
              </article>
            </div>

            <section className="rounded-xl border border-[#efe3d7] bg-[#fffdf9] p-4">
              <h3 className="text-sm font-semibold text-[#6b4a2f]">{topSectionTitle}</h3>
              <div className="mt-2 space-y-1 text-sm text-[#5d5650]">
                {topItems.length ? (
                  topItems.map((item) => (
                    <p key={item.itemName}>
                      {item.itemName} - {item.quantitySold} {isBookingReport ? 'booking/s' : 'sold'}
                    </p>
                  ))
                ) : (
                  <p>No completed {isBookingReport ? 'booking' : 'sales'} entries for the selected date.</p>
                )}
              </div>
            </section>

            <LegalBulletList
              title="Executive Summary"
              items={[analysis?.executiveSummary || 'No summary available.']}
            />
            <LegalBulletList title="Strengths" items={analysis?.strengths || []} />
            <LegalBulletList title="Risks" items={analysis?.risks || []} />
            <LegalBulletList title="Recommendations" items={analysis?.recommendations || []} />
            <LegalBulletList
              title="Legal / Compliance Notes"
              items={[...(analysis?.legalComplianceNotes || []), report?.legalNotice].filter(Boolean)}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default DailySales
