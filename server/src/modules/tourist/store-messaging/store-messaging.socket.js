import jwt from 'jsonwebtoken'
import User from '../../auth/models/user.model.js'
import { appendStoreMessage, assertSocketAccessToConversation } from './store-messaging.service.js'

const parseAccessTokenFromCookieHeader = (cookieHeader) => {
    if (!cookieHeader || typeof cookieHeader !== 'string') return null
    const parts = cookieHeader.split(';').map((p) => p.trim())
    for (const p of parts) {
        if (p.startsWith('accessToken=')) {
            return decodeURIComponent(p.slice('accessToken='.length))
        }
    }
    return null
}

/**
 * @param {import('socket.io').Server} io
 */
export const attachStoreMessagingSocket = (io) => {
    const nsp = io.of('/store-messaging')

    nsp.use(async (socket, next) => {
        try {
            const token =
                parseAccessTokenFromCookieHeader(socket.handshake.headers?.cookie) ||
                (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null)
            if (!token) {
                return next(new Error('UNAUTHORIZED'))
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const user = await User.findById(decoded._id).populate('roleId').select('-password')
            if (!user) {
                return next(new Error('UNAUTHORIZED'))
            }
            const roleName = user.roleId?.name ? String(user.roleId.name).toUpperCase() : ''
            if (roleName !== 'TOURIST' && roleName !== 'BUSINESS') {
                return next(new Error('FORBIDDEN'))
            }
            socket.data.userId = String(user._id)
            socket.data.role = roleName
            next()
        } catch {
            next(new Error('UNAUTHORIZED'))
        }
    })

    nsp.on('connection', (socket) => {
        socket.on('join', async (payload, ack) => {
            const conversationId = payload && typeof payload === 'object' ? payload.conversationId : null
            const reply = typeof ack === 'function' ? ack : () => {}
            if (!conversationId) {
                return reply({ ok: false, error: 'MISSING_CONVERSATION_ID' })
            }
            try {
                await assertSocketAccessToConversation({
                    conversationId,
                    userId: socket.data.userId,
                    role: socket.data.role
                })
                await socket.join(`conv:${conversationId}`)
                return reply({ ok: true })
            } catch (e) {
                const code = String(e?.message || '')
                if (code === 'FORBIDDEN') return reply({ ok: false, error: 'FORBIDDEN' })
                if (code === 'ORDER_MESSAGING_CLOSED') return reply({ ok: false, error: 'ORDER_CLOSED' })
                if (code === 'CONVERSATION_NOT_FOUND') return reply({ ok: false, error: 'NOT_FOUND' })
                if (code === 'ORDER_NOT_FOUND') return reply({ ok: false, error: 'NOT_FOUND' })
                return reply({ ok: false, error: 'FAILED' })
            }
        })

        socket.on('message:send', async (payload, ack) => {
            const reply = typeof ack === 'function' ? ack : () => {}
            const conversationId = payload && typeof payload === 'object' ? payload.conversationId : null
            const text = payload && typeof payload === 'object' ? payload.text : ''
            if (!conversationId) {
                return reply({ ok: false, error: 'MISSING_CONVERSATION_ID' })
            }
            try {
                await assertSocketAccessToConversation({
                    conversationId,
                    userId: socket.data.userId,
                    role: socket.data.role
                })
                const senderRole = socket.data.role === 'BUSINESS' ? 'BUSINESS' : 'TOURIST'
                const doc = await appendStoreMessage({
                    conversationId,
                    senderUserId: socket.data.userId,
                    senderRole,
                    body: text
                })
                nsp.to(`conv:${conversationId}`).emit('message:new', doc)
                return reply({ ok: true, message: doc })
            } catch (e) {
                const code = String(e?.message || '')
                if (code === 'EMPTY_MESSAGE') return reply({ ok: false, error: 'EMPTY_MESSAGE' })
                if (code === 'FORBIDDEN') return reply({ ok: false, error: 'FORBIDDEN' })
                if (code === 'ORDER_MESSAGING_CLOSED') return reply({ ok: false, error: 'ORDER_CLOSED' })
                if (code === 'CONVERSATION_NOT_FOUND') return reply({ ok: false, error: 'NOT_FOUND' })
                if (code === 'ORDER_NOT_FOUND') return reply({ ok: false, error: 'NOT_FOUND' })
                return reply({ ok: false, error: 'FAILED' })
            }
        })
    })
}
