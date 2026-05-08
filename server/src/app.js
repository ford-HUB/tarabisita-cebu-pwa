import cookieParser from "cookie-parser"
import express from "express"
import morgan from "morgan"
import cors from 'cors'

import authRoutes from "./modules/auth/auth.routes.js"
import paymentsWebhookRoutes from "./modules/payments/payments-webhook.routes.js"
import businessRoutes from "./modules/business/business.routes.js"
import touristRoutes from "./modules/tourist/tourist.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js"
import { recordHttpTiming, writeMorganLineToTelemetry } from './shared/utils/systemPerformanceTelemetry.utils.js'

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(cookieParser())

app.use(
    morgan('dev', {
        stream: {
            write: (line) => {
                writeMorganLineToTelemetry(line)
                process.stdout.write(line)
            }
        }
    })
)

app.use((req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000
        recordHttpTiming({
            method: req.method,
            path: req.originalUrl || req.url || '',
            statusCode: res.statusCode,
            durationMs: elapsedMs
        })
    })
    next()
})

const allowedOrigins = [
    process.env.CLIENT_LOCAL,
    process.env.CLIENT_PRODUCTION
].filter(Boolean)

const isAllowedVercelPreviewOrigin = (origin) => {
    return /^https:\/\/tara-bisita-[a-z0-9-]+\.vercel\.app$/i.test(origin)
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)

        const isAllowedOrigin = allowedOrigins.includes(origin) || isAllowedVercelPreviewOrigin(origin)

        if (isAllowedOrigin) return callback(null, true)

        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))

app.get('/', (_req, res) => {
    res.status(200).json({ ok: true, name: 'TaraBisita API' })
})

app.get('/api/v1', (_req, res) => {
    res.status(200).json({
        ok: true,
        version: 'v1',
        mounts: ['/auth', '/business', '/tourist', '/admin'],
        note: 'Payments webhook routes are served from src/modules/payments and include /api/v1/business/webhooks/xendit'
    })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/business', paymentsWebhookRoutes)
app.use('/api/v1/business', businessRoutes)
app.use('/api/v1/tourist', touristRoutes)
app.use('/api/v1/admin', adminRoutes)



export default app