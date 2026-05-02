export const truncateText = (value, maxLength = 80) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export const isTextTruncated = (value, maxLength = 80) => {
  const normalized = String(value ?? '').trim()
  return normalized.length > maxLength
}
