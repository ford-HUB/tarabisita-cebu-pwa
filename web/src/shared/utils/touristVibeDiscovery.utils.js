import { categoryDisplayLabel, categoryMatchesLabel } from './touristExplore.utils.js'

const blob = (b) =>
  `${b?.name || ''} ${b?.businessDescription || b?.description || ''} ${categoryDisplayLabel(b?.category)}`.toLowerCase()

/**
 * Map dashboard “vibe” ids to public businesses from the API (best-effort keyword + category match).
 * @param {string} vibeId
 * @param {unknown[]} businesses
 * @returns {unknown[]}
 */
export const filterBusinessesByVibeId = (vibeId, businesses) => {
  const list = Array.isArray(businesses) ? businesses : []
  if (!vibeId) return []

  switch (vibeId) {
    case 'restaurant':
      return list.filter((b) => categoryMatchesLabel(b?.category, 'Restaurant'))
    case 'beach':
      return list.filter((b) => {
        const t = blob(b)
        return t.includes('beach') || t.includes('island') || t.includes('resort') || t.includes('dive')
      })
    case 'heritage':
      return list.filter((b) => {
        const t = blob(b)
        return (
          t.includes('heritage') ||
          t.includes('basilica') ||
          t.includes('magellan') ||
          t.includes('museum') ||
          t.includes('historic')
        )
      })
    case 'market':
      return list.filter((b) => {
        const t = blob(b)
        return t.includes('market') || t.includes('pasalubong') || t.includes('sugbo') || t.includes('taboan')
      })
    case 'nightlife':
      return list.filter((b) => {
        const t = blob(b)
        return (
          t.includes('bar') ||
          t.includes('club') ||
          t.includes('night') ||
          t.includes('roofdeck') ||
          t.includes('live music')
        )
      })
    default:
      return []
  }
}
