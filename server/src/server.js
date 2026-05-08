import http from 'http'
import { Server } from 'socket.io'
import './configs/load-env.js'
import app from './app.js'
import { dbConnection } from './configs/db.config.js'
import { startXenditLedgerReconcileJob } from './jobs/xenditLedgerReconcile.job.js'
import { startTouristOrderCompletionEmailJob } from './jobs/touristOrderCompletionEmail.job.js'
import { startBookingPaymentExpiryAutoCancelJob } from './jobs/bookingPaymentExpiryAutoCancel.job.js'
import { startSystemPerformanceBroadcastJob } from './jobs/systemPerformanceBroadcast.job.js'
import { attachStoreMessagingSocket } from './modules/tourist/store-messaging/store-messaging.socket.js'
import {
    captureConsoleForSystemPerformance
} from './shared/utils/systemPerformanceTelemetry.utils.js'
import {
    attachSystemPerformanceSocket,
    emitSystemPerformanceSnapshot
} from './modules/admin/system-performance/system-performance.socket.js'

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || true,
        credentials: true
    }
})

attachStoreMessagingSocket(io)
attachSystemPerformanceSocket(io)
captureConsoleForSystemPerformance()

server.listen(process.env.PORT, async () => {
    await dbConnection()
    await startXenditLedgerReconcileJob()
    await startTouristOrderCompletionEmailJob()
    await startBookingPaymentExpiryAutoCancelJob()
    await startSystemPerformanceBroadcastJob({
        emitSnapshot: () => emitSystemPerformanceSnapshot(io)
    })
    console.log(`Server is running at http://localhost:${process.env.PORT}/api/v1`)
})
