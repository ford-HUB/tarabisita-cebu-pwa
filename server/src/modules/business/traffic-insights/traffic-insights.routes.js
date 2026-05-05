import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getMyTrafficInsights } from './traffic-insights.controller.js'

const trafficInsightsRoutes = express.Router()

trafficInsightsRoutes.get('/me/reports/traffic-insights', guard(['BUSINESS']), getMyTrafficInsights)

export default trafficInsightsRoutes
