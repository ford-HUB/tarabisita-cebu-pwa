const MAX_PRESETS = 4

const storageKey = (userId) => `tarabisita:menuFlavorPresets:${userId}`

export const readMenuFlavorPresets = (userId) => {
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

export const addMenuFlavorPreset = (userId, label) => {
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!userId || !trimmed) return readMenuFlavorPresets(userId)
  const existing = readMenuFlavorPresets(userId)
  const lower = trimmed.toLowerCase()
  const withoutDuplicate = existing.filter((entry) => entry.toLowerCase() !== lower)
  const next = [trimmed, ...withoutDuplicate].slice(0, MAX_PRESETS)
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  return next
}

export const removeMenuFlavorPreset = (userId, label) => {
  if (!userId) return []
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!trimmed) return readMenuFlavorPresets(userId)
  const existing = readMenuFlavorPresets(userId)
  const lower = trimmed.toLowerCase()
  const next = existing.filter((entry) => entry.toLowerCase() !== lower)
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
