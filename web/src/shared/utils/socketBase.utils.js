/**
 * Socket.IO runs on the API origin (not under `/api/v1`).
 * @returns {string}
 */
export const getSocketBaseUrl = () => {
  const isDev = import.meta.env.VITE_ENV === 'development'
  const api = isDev ? import.meta.env.VITE_SERVER_LOCAL : import.meta.env.VITE_SERVER_PRODUCTION
  return api ? new URL(api).origin : ''
}
