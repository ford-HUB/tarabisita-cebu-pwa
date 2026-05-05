import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    deleteBusinessStoreMessagingConversationHandler,
    getBusinessStoreMessagingConversationsHandler,
    getBusinessStoreMessagingNotificationsHandler,
    getBusinessStoreMessagingThreadHandler,
    markBusinessStoreMessagingNotificationsReadHandler
} from './store-messaging.controller.js'
import { businessStoreMessagingThreadQuerySchema } from './store-messaging.validator.js'

const businessStoreMessagingRoutes = express.Router()

businessStoreMessagingRoutes.get(
    '/me/store-messaging/conversations',
    guard(['BUSINESS']),
    getBusinessStoreMessagingConversationsHandler
)

businessStoreMessagingRoutes.get(
    '/me/store-messaging/notifications',
    guard(['BUSINESS']),
    getBusinessStoreMessagingNotificationsHandler
)

businessStoreMessagingRoutes.post(
    '/me/store-messaging/notifications/read',
    guard(['BUSINESS']),
    markBusinessStoreMessagingNotificationsReadHandler
)

businessStoreMessagingRoutes.get(
    '/me/store-messaging/thread',
    guard(['BUSINESS']),
    validateRequest(businessStoreMessagingThreadQuerySchema),
    getBusinessStoreMessagingThreadHandler
)

businessStoreMessagingRoutes.delete(
    '/me/store-messaging/conversations',
    guard(['BUSINESS']),
    validateRequest(businessStoreMessagingThreadQuerySchema),
    deleteBusinessStoreMessagingConversationHandler
)

export default businessStoreMessagingRoutes
