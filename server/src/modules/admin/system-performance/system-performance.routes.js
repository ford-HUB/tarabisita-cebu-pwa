import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getSystemPerformanceSnapshotController } from './system-performance.controller.js'

const systemPerformanceRoutes = express.Router()

systemPerformanceRoutes.get('/snapshot', guard(['ADMIN']), getSystemPerformanceSnapshotController)

export default systemPerformanceRoutes
