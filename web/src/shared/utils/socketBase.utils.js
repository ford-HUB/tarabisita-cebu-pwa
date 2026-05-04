/**
 * Socket.IO runs on the API origin (not under `/api/v1`).
 * @returns {string}
 */
export const getSocketBaseUrl = () => {
  const api = import.meta.env.VITE_SERVER_LOCAL || ''
  try {
    return new URL(api).origin
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }
}
