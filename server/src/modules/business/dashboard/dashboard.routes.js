import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getMyBusinessDashboard } from './dashboard.controller.js'

const dashboardRoutes = express.Router()

dashboardRoutes.get('/me/reports/dashboard', guard(['BUSINESS']), getMyBusinessDashboard)

export default dashboardRoutes
