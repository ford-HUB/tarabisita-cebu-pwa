const MAX_PRESETS = 4

const storageKey = (userId) => `tarabisita:menuCategoryPresets:${userId}`

export const readMenuCategoryPresets = (userId) => {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => entry.trim())
      .slice(0, MAX_PRESETS)
  } catch {
    return []
  }
}

export const addMenuCategoryPreset = (userId, label) => {
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!userId || !trimmed) return readMenuCategoryPresets(userId)
  const existing = readMenuCategoryPresets(userId)
  const lower = trimmed.toLowerCase()
  const withoutDuplicate = existing.filter((c) => c.toLowerCase() !== lower)
  const next = [trimmed, ...withoutDuplicate].slice(0, MAX_PRESETS)
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  return next
}

export const removeMenuCategoryPreset = (userId, label) => {
  if (!userId) return []
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!trimmed) return readMenuCategoryPresets(userId)
  const existing = readMenuCategoryPresets(userId)
  const lower = trimmed.toLowerCase()
  const next = existing.filter((c) => c.toLowerCase() !== lower)
  try {
    if (next.length === 0) {
      localStorage.removeItem(storageKey(userId))
    } else {
      localStorage.setItem(storageKey(userId), JSON.stringify(next))
    }
  } catch {
    // ignore quota / private mode
  }
  return next
}
