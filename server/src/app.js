import cookieParser from "cookie-parser"
import express from "express"
import morgan from "morgan"
import cors from 'cors'

import authRoutes from "./modules/auth/auth.routes.js"
import businessRoutes from "./modules/business/business.routes.js"

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(cookieParser())

app.use(morgan('dev'))

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/business', businessRoutes)



export default app