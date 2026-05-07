import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import handlebars from 'handlebars'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const toFiniteNumber = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
}

/** Currency formatter shared by every template (e.g. order receipts, billing). */
handlebars.registerHelper('phpAmount', (value) => {
    return new handlebars.SafeString(
        `PHP ${toFiniteNumber(value).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
    )
})

/** Inline math used by line-item subtotals (`{{phpAmount (multiply qty unit)}}`). */
handlebars.registerHelper('multiply', (a, b) => toFiniteNumber(a) * toFiniteNumber(b))

/** Strips the `×N` and `(+N more)` decorations appended at order-time so legacy
 *  rows (which lack `lineItems`) still display a clean product name. */
handlebars.registerHelper('cleanProductName', (value) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const withoutMore = raw.replace(/\s*\(\+\d+\s*more\)\s*$/i, '')
    return withoutMore.replace(/\s*[×x]\s*\d+\s*$/i, '').trim()
})

export const templateReader = (templateName, data) => {
    const templatePath = path.join(__dirname, `../templates/${templateName}.html`)
    const templateSource = fs.readFileSync(templatePath, 'utf-8')

    return handlebars.compile(templateSource)(data)
}
