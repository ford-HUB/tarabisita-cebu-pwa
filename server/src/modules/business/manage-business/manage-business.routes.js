import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { getBusinessApprovalQueue, getBusinessPartners, updateBusinessApprovalStatus } from './manage-business.controller.js'

const manageBusinessRoutes = express.Router()

manageBusinessRoutes.get('/admin/approval-queue', guard(['ADMIN']), getBusinessApprovalQueue)
manageBusinessRoutes.get('/admin/partners', guard(['ADMIN']), getBusinessPartners)
manageBusinessRoutes.patch('/admin/approval-queue/:businessId', guard(['ADMIN']), updateBusinessApprovalStatus)

export default manageBusinessRoutes
