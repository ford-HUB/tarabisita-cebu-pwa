export const BUSINESS_CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'HOTEL', label: 'Hotel' }
]

export const BUSINESS_CATEGORY_LABEL_BY_VALUE = BUSINESS_CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const getBusinessCategoryLabel = (value) => {
  if (!value) return 'Business'
  return BUSINESS_CATEGORY_LABEL_BY_VALUE[value] || value
}
