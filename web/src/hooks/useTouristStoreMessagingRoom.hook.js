import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { getSocketBaseUrl } from '../shared/utils/socketBase.utils.js'
import {
  getStoreMessagingConversations,
  getStoreMessagingSession,
  getStoreMessagingThread
} from '../services/tourist/store-messaging.service.js'

/**
 * @param {{ m: string | null, c: string | null }} params
 */
export const useTouristStoreMessagingRoom = ({ m, c }) => {
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

  const mode = m ? 'token' : c ? 'thread' : 'hub'

  useEffect(() => {
    if (mode !== 'hub') {
      return undefined
    }
    let cancelled = false
    setHub((h) => ({ ...h, loading: true, error: null }))
    ;(async () => {
      try {
        const res = await getStoreMessagingConversations()
        const items = res.data?.data || []
        if (!cancelled) setHub({ items, loading: false, error: null })
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Could not load messages.'
        if (!cancelled) setHub({ items: [], loading: false, error: msg })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'hub') {
      setRoom({ session: null, messages: [], loading: false, error: null, socketConnected: false })
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
        const res = m ? await getStoreMessagingSession(m) : await getStoreMessagingThread(c)
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

        const socket = io(`${socketBase}/store-messaging`, {
          withCredentials: true,
          transports: ['websocket', 'polling']
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

        socket.on('message:new', (msg) => {
          setRoom((r) => {
            if (!msg?.id || r.messages.some((x) => x.id === msg.id)) return r
            return { ...r, messages: [...r.messages, msg] }
          })
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
  }, [mode, m, c])

  useEffect(() => {
    conversationIdRef.current = room.session?.conversationId || null
  }, [room.session?.conversationId])

  const sendMessage = useCallback((text) => {
    const socket = socketRef.current
    const conversationId = conversationIdRef.current
    if (!socket?.connected || !conversationId) {
      toast.error('Not connected yet. Please wait.')
      return
    }
    const trimmed = String(text || '').trim()
    if (!trimmed) return
    socket.emit('message:send', { conversationId, text: trimmed }, (ack) => {
      if (!ack?.ok) {
        toast.error('Message could not be sent.')
      }
    })
  }, [])

  return { mode, hub, room, sendMessage }
}
