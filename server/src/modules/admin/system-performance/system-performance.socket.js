import jwt from 'jsonwebtoken'
import User from '../../auth/models/user.model.js'
import { getAdminSystemPerformanceSnapshot } from './system-performance.service.js'

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

export const emitSystemPerformanceSnapshot = (io) => {
    const payload = getAdminSystemPerformanceSnapshot()
    io.of('/admin-system-performance').emit('system-performance:update', payload)
}

/**
 * @param {import('socket.io').Server} io
 */
export const attachSystemPerformanceSocket = (io) => {
    const nsp = io.of('/admin-system-performance')

    nsp.use(async (socket, next) => {
        try {
            const token =
                parseAccessTokenFromCookieHeader(socket.handshake.headers?.cookie) ||
                (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null)
            if (!token) return next(new Error('UNAUTHORIZED'))

            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const user = await User.findById(decoded._id).populate('roleId').select('-password')
            if (!user) return next(new Error('UNAUTHORIZED'))
            if (String(user.roleId?.name || '').toUpperCase() !== 'ADMIN') return next(new Error('FORBIDDEN'))

            socket.data.userId = String(user._id)
            next()
        } catch {
            next(new Error('UNAUTHORIZED'))
        }
    })

    nsp.on('connection', (socket) => {
        socket.emit('system-performance:update', getAdminSystemPerformanceSnapshot())
        socket.on('snapshot:request', () => {
            socket.emit('system-performance:update', getAdminSystemPerformanceSnapshot())
        })
    })
}
