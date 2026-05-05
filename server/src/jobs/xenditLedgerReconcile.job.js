import { Agenda } from 'agenda'
import { MongoBackend } from '@agendajs/mongo-backend'
import mongoose from 'mongoose'
import { reconcileXenditWebhooksForBusinessLedger } from '../modules/payments/payments.service.js'

const JOB_NAME = 'xendit-ledger-reconcile'

/** Default 2 minutes; minimum 60s. Set XENDIT_LEDGER_RECONCILE_DISABLED=1 to turn off. */
const getIntervalMs = () => {
    const n = Number(process.env.XENDIT_LEDGER_RECONCILE_MS)
    if (Number.isFinite(n) && n >= 60000) {
        return n
    }
    return 120000
}

const getDefaultLimit = () => {
    const n = Number(process.env.XENDIT_LEDGER_RECONCILE_LIMIT)
    if (Number.isFinite(n) && n >= 1) {
        return Math.min(n, 100)
    }
    return 50
}

let runtime = null
let shutdownHooksRegistered = false

const registerShutdownHooksOnce = () => {
    if (shutdownHooksRegistered) {
        return
    }
    shutdownHooksRegistered = true
    const stop = () => {
        void stopXenditLedgerReconcileJob().catch((err) =>
            console.error('[xendit-ledger-reconcile] shutdown error', err?.message || err)
        )
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
}

export const stopXenditLedgerReconcileJob = async () => {
    if (!runtime) {
        return
    }
    const { agenda } = runtime
    runtime = null
    await agenda.stop(false)
}

export const startXenditLedgerReconcileJob = async () => {
    if (String(process.env.XENDIT_LEDGER_RECONCILE_DISABLED || '').trim() === '1') {
        return
    }
    if (runtime) {
        return
    }

    if (mongoose.connection.readyState !== 1) {
        console.log('[xendit-ledger-reconcile] skipped (MongoDB not connected)')
        return
    }

    const db = mongoose.connection.db
    if (!db) {
        console.log('[xendit-ledger-reconcile] skipped (no MongoDB handle)')
        return
    }

    const defaultLimit = getDefaultLimit()
    const intervalMs = getIntervalMs()

    const agenda = new Agenda({
        backend: new MongoBackend({
            mongo: db,
            collection: 'xenditLedgerAgendaJobs'
        }),
        defaultConcurrency: 1,
        maxConcurrency: 1
    })

    agenda.on('error', (err) => {
        console.error('[xendit-ledger-reconcile] agenda error', err?.message || err)
    })

    agenda.define(
        JOB_NAME,
        async (job) => {
            const limit = Math.min(Math.max(Number(job.attrs.data?.limit) || defaultLimit, 1), 100)
            const result = await reconcileXenditWebhooksForBusinessLedger({ limit })
            if (result.processed > 0 || result.errors > 0) {
                console.log('[xendit-ledger-reconcile]', result)
            }
        },
        { concurrency: 1 }
    )

    try {
        await agenda.start()
        await agenda.cancel({ name: JOB_NAME })
        await agenda.every(intervalMs, JOB_NAME, { limit: defaultLimit }, { skipImmediate: true })
        await agenda.now(JOB_NAME, { limit: defaultLimit })
    } catch (err) {
        console.error('[xendit-ledger-reconcile] failed to start', err?.message || err)
        await agenda.stop(false).catch(() => {})
        return
    }

    runtime = { agenda }
    registerShutdownHooksOnce()
}
