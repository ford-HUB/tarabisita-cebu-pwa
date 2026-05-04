import express from 'express'
import sessionRoutes from '../business/session/session.routes.js'

const authRoutes = express.Router()

authRoutes.use(sessionRoutes)

export default authRoutes
