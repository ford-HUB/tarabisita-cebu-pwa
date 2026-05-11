import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { getSocketBaseUrl } from '../shared/utils/socketBase.utils.js'
import {
  deleteBusinessStoreMessagingConversation,
  getBusinessStoreMessagingConversations,
  getBusinessStoreMessagingThread
} from '../services/business/store-messaging.service.js'
import { useBusinessStoreNotificationsStore } from '../store/business/business-store-notifications.store.js'

/**
 * @param {{
 *   conversationId: string | null,
 *   enableHubRefetchOnRemoteTouristMessage?: boolean
 * }} params
 */
export const useBusinessStoreMessaging = ({
  conversationId,
  enableHubRefetchOnRemoteTouristMessage = false
}) => {
  const [hub, setHub] = useState({ items: [], loading: false, error: null })
  const [room, setRoom] = useState({
    session: null,
    messages: [],
    loading: false,
    error: null,
    socketConnected: false
  })
  const socketRef = useRef(null)
  const loadSeqRef = useRef(0)
  const conversationIdRef = useRef(null)

  const fetchHub = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setHub((h) => ({ ...h, loading: true, error: null }))
    }
    try {
      const res = await getBusinessStoreMessagingConversations()
      const items = res.data?.data || []
      setHub((h) => ({
        ...h,
        items,
        ...(silent ? {} : { loading: false, error: null })
      }))
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Could not load chats.'
      if (!silent) {
        setHub({ items: [], loading: false, error: msg })
      }
    }
  }, [])

  useEffect(() => {
    void fetchHub()
  }, [fetchHub])

  useEffect(() => {
    if (!conversationId) {
      setRoom({ session: null, messages: [], loading: false, error: null, socketConnected: false })
      const s = socketRef.current
      socketRef.current = null
      s?.removeAllListeners()
      s?.disconnect()
      return undefined
    }

    const seq = ++loadSeqRef.current
    let cancelled = false
    const socketBase = getSocketBaseUrl()
    if (!socketBase) {
      setRoom({ session: null, messages: [], loading: false, error: 'Missing server URL.', socketConnected: false })
      return undefined
    }

    setRoom({ session: null, messages: [], loading: true, error: null, socketConnected: false })

    ;(async () => {
      try {
        const res = await getBusinessStoreMessagingThread(conversationId)
        if (cancelled || seq !== loadSeqRef.current) return
        const data = res.data?.data
        if (!data?.conversationId) throw new Error('INVALID_RESPONSE')
        const messages = Array.isArray(data.messages) ? data.messages : []
        setRoom({
          session: data,
          messages,
          loading: false,
          error: null,
          socketConnected: false
        })
        void useBusinessStoreNotificationsStore.getState().fetchSummary()

        const socket = io(`${socketBase}/store-messaging`, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: 5,
          reconnectionDelay: 800,
          reconnectionDelayMax: 4000
        })
        socketRef.current = socket

        socket.on('connect', () => {
          if (cancelled || seq !== loadSeqRef.current) return
          setRoom((r) => ({ ...r, socketConnected: true }))
          socket.emit('join', { conversationId: data.conversationId }, (ack) => {
            if (!ack?.ok) {
              toast.error('Could not join chat room.')
            }
          })
        })

        socket.on('disconnect', () => {
          setRoom((r) => ({ ...r, socketConnected: false }))
        })

        socket.on('connect_error', () => {
          setRoom((r) => ({ ...r, socketConnected: false }))
        })

        socket.on('message:new', (msg) => {
          setRoom((r) => {
            if (!msg?.id || r.messages.some((x) => x.id === msg.id)) return r
            return { ...r, messages: [...r.messages, msg] }
          })
          if (msg?.senderRole === 'TOURIST') {
            const other = String(msg.conversationId || '') !== String(conversationId || '')
            if (other) {
              void useBusinessStoreNotificationsStore.getState().fetchSummary()
              if (enableHubRefetchOnRemoteTouristMessage) void fetchHub({ silent: true })
            }
          }
        })
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Could not open chat.'
        if (!cancelled && seq === loadSeqRef.current) {
          setRoom({ session: null, messages: [], loading: false, error: msg, socketConnected: false })
        }
      }
    })()

    return () => {
      cancelled = true
      const s = socketRef.current
      socketRef.current = null
      s?.removeAllListeners()
      s?.disconnect()
    }
  }, [conversationId, enableHubRefetchOnRemoteTouristMessage, fetchHub])

  useEffect(() => {
    conversationIdRef.current = room.session?.conversationId || null
  }, [room.session?.conversationId])

  const sendMessage = useCallback((text) => {
    const socket = socketRef.current
    const cid = conversationIdRef.current
    if (!socket?.connected || !cid) {
      toast.error('Not connected yet. Please wait.')
      return
    }
    const trimmed = String(text || '').trim()
    if (!trimmed) return
    socket.emit('message:send', { conversationId: cid, text: trimmed }, (ack) => {
      if (!ack?.ok) {
        toast.error('Message could not be sent.')
      }
    })
  }, [])

  const deleteConversation = useCallback(
    async (targetConversationId) => {
      const cid = String(targetConversationId || '').trim()
      if (!cid) return false

      try {
        await deleteBusinessStoreMessagingConversation(cid)
        setHub((h) => ({
          ...h,
          items: Array.isArray(h.items) ? h.items.filter((item) => String(item?.conversationId) !== cid) : []
        }))

        if (String(conversationId || '') === cid) {
          const s = socketRef.current
          socketRef.current = null
          s?.removeAllListeners()
          s?.disconnect()
          setRoom({ session: null, messages: [], loading: false, error: null, socketConnected: false })
          conversationIdRef.current = null
        }

        void useBusinessStoreNotificationsStore.getState().fetchSummary()
        toast.success('Conversation deleted.')
        return true
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Could not delete conversation.'
        toast.error(msg)
        return false
      }
    },
    [conversationId]
  )

  return { hub, room, sendMessage, deleteConversation }
}
