import express from 'express'
import { guard } from '../../../shared/middlewares/guard.js'
import { validateRequest } from '../../../shared/middlewares/validateRequest.js'
import {
    getStoreMessagingConversationsHandler,
    getStoreMessagingSessionHandler,
    getStoreMessagingThreadHandler,
    postStoreMessagingLinkTokenHandler
} from './store-messaging.controller.js'
import {
    storeMessagingLinkBodySchema,
    storeMessagingSessionQuerySchema,
    storeMessagingThreadQuerySchema
} from './store-messaging.validator.js'

const storeMessagingRoutes = express.Router()

storeMessagingRoutes.post(
    '/store-messaging/link-token',
    guard(['TOURIST']),
    validateRequest(storeMessagingLinkBodySchema),
    postStoreMessagingLinkTokenHandler
)

storeMessagingRoutes.get(
    '/store-messaging/session',
    guard(['TOURIST']),
    validateRequest(storeMessagingSessionQuerySchema),
    getStoreMessagingSessionHandler
)

storeMessagingRoutes.get(
    '/store-messaging/thread',
    guard(['TOURIST']),
    validateRequest(storeMessagingThreadQuerySchema),
    getStoreMessagingThreadHandler
)

storeMessagingRoutes.get('/store-messaging/conversations', guard(['TOURIST']), getStoreMessagingConversationsHandler)

export default storeMessagingRoutes
