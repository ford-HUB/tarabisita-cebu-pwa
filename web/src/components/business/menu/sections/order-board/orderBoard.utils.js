import {
  ACTION_MENU_GAP,
  ACTION_MENU_HEIGHT,
  ACTION_MENU_WIDTH,
  VIEWPORT_PADDING
} from './orderBoard.constants'

/**
 * @param {HTMLElement} triggerElement
 * @returns {{ top: number, left: number } | null}
 */
export const getActionMenuPlacement = (triggerElement) => {
  if (!triggerElement) return null
  const rect = triggerElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = rect.right + ACTION_MENU_GAP
  if (left + ACTION_MENU_WIDTH > viewportWidth - VIEWPORT_PADDING) {
    left = rect.left - ACTION_MENU_WIDTH - ACTION_MENU_GAP
  }
  if (left < VIEWPORT_PADDING) {
    left = viewportWidth - ACTION_MENU_WIDTH - VIEWPORT_PADDING
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING
  }

  let top = rect.top + rect.height / 2 - ACTION_MENU_HEIGHT / 2
  if (top < VIEWPORT_PADDING) {
    top = VIEWPORT_PADDING
  }
  if (top + ACTION_MENU_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
    top = viewportHeight - ACTION_MENU_HEIGHT - VIEWPORT_PADDING
  }

  return { top, left }
}
