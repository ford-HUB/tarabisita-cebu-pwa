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
