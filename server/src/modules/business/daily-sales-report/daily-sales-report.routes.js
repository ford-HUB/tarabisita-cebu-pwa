import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getMyDailySalesReport } from './daily-sales-report.controller.js'

const dailySalesReportRoutes = express.Router()

dailySalesReportRoutes.get('/me/reports/daily-sales', guard(['BUSINESS']), getMyDailySalesReport)

export default dailySalesReportRoutes
