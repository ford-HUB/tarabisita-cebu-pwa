import { Agenda } from 'agenda'
import { MongoBackend } from '@agendajs/mongo-backend'
import mongoose from 'mongoose'
import { autoCancelExpiredBookingPaymentOrders } from '../modules/payments/payments.service.js'

const JOB_NAME = 'booking-payment-expiry-auto-cancel'
const JOB_REPEAT_EVERY = process.env.BOOKING_PAYMENT_EXPIRY_SCAN_EVERY || '5 minutes'
const JOB_COLLECTION = 'bookingPaymentExpiryAgendaJobs'

let runtime = null
let shutdownHooksRegistered = false

const registerShutdownHooksOnce = () => {
    if (shutdownHooksRegistered) return
    shutdownHooksRegistered = true
    const stop = () => {
        void stopBookingPaymentExpiryAutoCancelJob().catch((err) =>
            console.error('[booking-payment-expiry-auto-cancel] shutdown error', err?.message || err)
        )
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
}

export const stopBookingPaymentExpiryAutoCancelJob = async () => {
    if (!runtime) return
    const { agenda } = runtime
    runtime = null
    await agenda.stop(false)
}

export const startBookingPaymentExpiryAutoCancelJob = async () => {
    if (String(process.env.BOOKING_PAYMENT_EXPIRY_AUTO_CANCEL_DISABLED || '').trim() === '1') {
        return
    }
    if (runtime) return
    if (mongoose.connection.readyState !== 1) {
        console.log('[booking-payment-expiry-auto-cancel] skipped (MongoDB not connected)')
        return
    }
    const db = mongoose.connection.db
    if (!db) {
        console.log('[booking-payment-expiry-auto-cancel] skipped (no MongoDB handle)')
        return
    }

    const agenda = new Agenda({
        backend: new MongoBackend({
            mongo: db,
            collection: JOB_COLLECTION
        }),
        defaultConcurrency: 1,
        maxConcurrency: 1
    })

    agenda.on('error', (err) => {
        console.error('[booking-payment-expiry-auto-cancel] agenda error', err?.message || err)
    })

    agenda.define(
        JOB_NAME,
        async () => {
            const result = await autoCancelExpiredBookingPaymentOrders()
            if ((result?.canceledCount || 0) > 0) {
                console.log(
                    `[booking-payment-expiry-auto-cancel] canceled ${result.canceledCount} expired booking(s) out of ${result.checkedCount} checked`
                )
            }
        },
        { concurrency: 1 }
    )

    try {
        await agenda.start()
        await agenda.every(JOB_REPEAT_EVERY, JOB_NAME)
    } catch (err) {
        console.error('[booking-payment-expiry-auto-cancel] failed to start', err?.message || err)
        await agenda.stop(false).catch(() => {})
        return
    }

    runtime = { agenda }
    registerShutdownHooksOnce()
}
