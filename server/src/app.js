import cookieParser from "cookie-parser"
import express from "express"
import morgan from "morgan"
import cors from 'cors'

import authRoutes from "./modules/auth/auth.routes.js"
import paymentsWebhookRoutes from "./modules/payments/payments-webhook.routes.js"
import businessRoutes from "./modules/business/business.routes.js"
import touristRoutes from "./modules/tourist/tourist.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js"

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(cookieParser())

app.use(morgan('dev'))

app.use(cors({
    origin: process.env.CLIENT_URL,
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
        note: 'PayMongo webhook routes are served from src/modules/payments but mounted at /api/v1/business/webhooks/*'
    })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/business', paymentsWebhookRoutes)
app.use('/api/v1/business', businessRoutes)
app.use('/api/v1/tourist', touristRoutes)
app.use('/api/v1/admin', adminRoutes)



export default app