import { Agenda } from 'agenda'
import { MongoBackend } from '@agendajs/mongo-backend'
import mongoose from 'mongoose'

const JOB_NAME = 'system-performance-broadcast'
const JOB_COLLECTION = 'systemPerformanceAgendaJobs'
const JOB_REPEAT_EVERY = process.env.SYSTEM_PERFORMANCE_BROADCAST_EVERY || '1 second'

let runtime = null
let shutdownHooksRegistered = false

const registerShutdownHooksOnce = () => {
    if (shutdownHooksRegistered) return
    shutdownHooksRegistered = true
    const stop = () => {
        void stopSystemPerformanceBroadcastJob().catch((err) =>
            console.error('[system-performance-broadcast] shutdown error', err?.message || err)
        )
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
}

export const stopSystemPerformanceBroadcastJob = async () => {
    if (!runtime) return
    const { agenda } = runtime
    runtime = null
    await agenda.stop(false)
}

export const startSystemPerformanceBroadcastJob = async ({ emitSnapshot }) => {
    if (String(process.env.SYSTEM_PERFORMANCE_BROADCAST_DISABLED || '').trim() === '1') {
        return
    }
    if (runtime) return
    if (typeof emitSnapshot !== 'function') {
        console.log('[system-performance-broadcast] skipped (missing emitter)')
        return
    }
    if (mongoose.connection.readyState !== 1) {
        console.log('[system-performance-broadcast] skipped (MongoDB not connected)')
        return
    }
    const db = mongoose.connection.db
    if (!db) {
        console.log('[system-performance-broadcast] skipped (no MongoDB handle)')
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
        console.error('[system-performance-broadcast] agenda error', err?.message || err)
    })

    agenda.define(
        JOB_NAME,
        async () => {
            emitSnapshot()
        },
        { concurrency: 1 }
    )

    try {
        await agenda.start()
        await agenda.cancel({ name: JOB_NAME })
        await agenda.every(JOB_REPEAT_EVERY, JOB_NAME, {}, { skipImmediate: true })
        await agenda.now(JOB_NAME)
    } catch (err) {
        console.error('[system-performance-broadcast] failed to start', err?.message || err)
        await agenda.stop(false).catch(() => {})
        return
    }

    runtime = { agenda }
    registerShutdownHooksOnce()
}
