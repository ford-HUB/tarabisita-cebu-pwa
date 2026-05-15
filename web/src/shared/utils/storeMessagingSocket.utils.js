import { io } from 'socket.io-client'

/**
 * Opens a dedicated Socket.IO client for `/store-messaging`.
 * Uses `forceNew` so React Strict Mode cleanup does not leave a shared manager stuck reconnecting.
 *
 * @param {{
 *   socketBase: string,
 *   conversationId: string,
 *   isActive: () => boolean,
 *   onConnected: () => void,
 *   onDisconnected: () => void,
 *   onMessage: (msg: unknown) => void,
 *   onJoinFailed?: (ack: { ok?: boolean, error?: string }) => void,
 * }} params
 * @returns {import('socket.io-client').Socket}
 */
export const connectStoreMessagingSocket = ({
  socketBase,
  conversationId,
  isActive,
  onConnected,
  onDisconnected,
  onMessage,
  onJoinFailed
}) => {
  const socket = io(`${socketBase}/store-messaging`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnectionAttempts: 5,
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
    forceNew: true
  })

  const joinConversation = () => {
    if (!isActive()) return
    onConnected()
    socket.emit('join', { conversationId }, (ack) => {
      if (!isActive()) return
      if (!ack?.ok) {
        onJoinFailed?.(ack || {})
      }
    })
  }

  socket.on('connect', joinConversation)

  socket.on('disconnect', () => {
    if (!isActive()) return
    onDisconnected()
  })

  socket.on('connect_error', () => {
    if (!isActive()) return
    onDisconnected()
  })

  socket.on('message:new', (msg) => {
    if (!isActive()) return
    onMessage(msg)
  })

  if (socket.connected) {
    joinConversation()
  }

  return socket
}

/** @param {import('socket.io-client').Socket | null | undefined} socket */
export const disconnectStoreMessagingSocket = (socket) => {
  socket?.removeAllListeners()
  socket?.disconnect()
}
