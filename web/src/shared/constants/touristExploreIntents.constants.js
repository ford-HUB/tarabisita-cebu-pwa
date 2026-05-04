/**
 * What tourists want to do (order, book, rent) — maps to partner category labels.
 * Labels must match {@link BUSINESS_CATEGORIES} `label` values.
 */
export const TOURIST_SERVICE_INTENTS = [
  {
    id: 'INTENT_FOOD',
    label: 'Order food',
    description: 'Restaurants & dining',
    categoryLabels: ['Restaurant']
  },
  {
    id: 'INTENT_STAY',
    label: 'Book a stay',
    description: 'Resorts & hotels',
    categoryLabels: ['Resort', 'Hotel']
  },
  {
    id: 'INTENT_RENTAL',
    label: 'Rentals & rides',
    description: 'Transport & getting around',
    categoryLabels: ['Transport']
  },
  {
    id: 'INTENT_EXPERIENCES',
    label: 'Things to do',
    description: 'Tours, wellness & fun',
    categoryLabels: ['Tour', 'Entertainment', 'Wellness']
  }
]
