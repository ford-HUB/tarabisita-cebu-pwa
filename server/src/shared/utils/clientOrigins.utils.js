const isDevelopment = () => process.env.NODE_ENV !== 'production'

const isAllowedVercelPreviewOrigin = (origin) =>
    /^https:\/\/tara-bisita-[a-z0-9-]+\.vercel\.app$/i.test(origin)

/** Active client origin for the current environment (local in dev, production otherwise). */
export const getActiveClientOrigin = () => {
    if (isDevelopment()) {
        return process.env.CLIENT_LOCAL || ''
    }
    return process.env.CLIENT_PRODUCTION || ''
}

/** Origins allowed for CORS / Socket.IO in the current environment. */
export const getAllowedClientOrigins = () => {
    const active = getActiveClientOrigin()
    return active ? [active] : []
}

/** @param {string | undefined} origin */
export const isAllowedClientOrigin = (origin) => {
    if (!origin) return true

    const allowed = getAllowedClientOrigins()
    if (!allowed.length) return true

    return allowed.includes(origin) || isAllowedVercelPreviewOrigin(origin)
}
