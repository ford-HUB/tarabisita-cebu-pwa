/**
 * Quick replies when the chat is tied to a stay / booking request order.
 */
export const BOOKING_REQUEST_QUICK_REPLIES = [
  'Is the room still available?',
  'Can I change my check-in date?',
  'What time is check-in?',
  'Do you offer airport pickup?',
  'Is breakfast included?'
]

/**
 * Quick replies when the chat is tied to a restaurant menu order.
 */
export const MENU_ORDER_QUICK_REPLIES = [
  'How long until my order is ready?',
  'Can I change or add something to my order?',
  'Do you have vegetarian or halal options?',
  'Can I request extra utensils or napkins?',
  'What time do you close today?'
]

/**
 * @param {string | undefined | null} orderType — e.g. `MENU_ORDER`, `BOOKING_REQUEST`
 * @returns {string[]}
 */
export const getTouristStoreDefaultQuickReplies = (orderType) => {
  const t = String(orderType || '').toUpperCase()
  if (t === 'MENU_ORDER') return MENU_ORDER_QUICK_REPLIES
  if (t === 'INQUIRY') return BOOKING_REQUEST_QUICK_REPLIES
  return BOOKING_REQUEST_QUICK_REPLIES
}

/** Default when order type is unknown or not passed (stay/booking copy). */
export const DEFAULT_QUICK_REPLIES = BOOKING_REQUEST_QUICK_REPLIES
