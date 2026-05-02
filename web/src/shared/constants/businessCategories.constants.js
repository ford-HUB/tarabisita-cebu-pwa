export const BUSINESS_CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'TOUR', label: 'Tour' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' }
]

export const BUSINESS_CATEGORY_LABEL_BY_VALUE = BUSINESS_CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const getBusinessCategoryLabel = (value) => {
  if (!value) return 'Business'
  return BUSINESS_CATEGORY_LABEL_BY_VALUE[value] || value
}
