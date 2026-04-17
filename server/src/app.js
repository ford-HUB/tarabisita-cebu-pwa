import cookieParser from "cookie-parser"
import express from "express"
import morgan from "morgan"
import cors from 'cors'

import authRoutes from "./modules/auth/auth.routes.js"

const app = express()

app.use(express.json())

app.use(cookieParser())

app.use(morgan('dev'))

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use('/api/v1/auth', authRoutes)



export default app