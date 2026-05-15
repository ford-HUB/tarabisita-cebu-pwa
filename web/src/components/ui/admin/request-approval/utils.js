import { statusLabel } from './constants'

const csvEscape = (value) => {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** @param {Array<Record<string, unknown>>} rows */
export const buildRequestApprovalCsv = (rows) => {
  const header = [
    'Business ID',
    'Business',
    'Owner',
    'Owner email',
    'Phone',
    'Category',
    'Address',
    'Submitted',
    'Status'
  ]
  const lines = rows.map((row) =>
    [
      row.id,
      row.businessName,
      row.ownerName,
      row.ownerEmail,
      row.phone,
      row.category,
      row.address,
      row.submittedAt,
      statusLabel[row.status] || row.status
    ].map(csvEscape).join(',')
  )
  return [header.join(','), ...lines].join('\r\n')
}

export const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return '-'
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

export const getInitials = (name) => {
  if (!name) return 'B'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export const isImageLink = (value = '') =>
  /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(value) || value.includes('cloudinary')
