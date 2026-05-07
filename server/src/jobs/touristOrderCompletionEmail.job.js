import { Agenda } from 'agenda'
import { MongoBackend } from '@agendajs/mongo-backend'
import mongoose from 'mongoose'
import CustomerOrder from '../modules/business/customer-orders/models/customer-order.model.js'
import Business from '../modules/business/models/business.model.js'
import User from '../modules/auth/models/user.model.js'
import { sendMailer } from '../modules/auth/auth.service.js'
import { templateReader } from '../shared/utils/templateReaderExtractor.js'

/**
 * Agenda job that sends a single "your order is ready" email to a tourist when every
 * order in their checkout group with a given business has reached FINISHED.
 *
 * Grouping rule: same `placedByUserId` + same `businessId` + `createdAt` within
 * `ORDER_COMPLETION_EMAIL_GROUP_WINDOW_MS` of the trigger order, none yet emailed.
 */
const JOB_NAME = 'tourist-order-completion-email'
const SCHEDULE_DEBOUNCE_LABEL = 'in 5 seconds'
const DEFAULT_GROUP_WINDOW_MS = 60 * 1000

const getGroupWindowMs = () => {
    const raw = Number(process.env.ORDER_COMPLETION_EMAIL_GROUP_WINDOW_MS)
    if (Number.isFinite(raw) && raw >= 1000) {
        return Math.min(raw, 30 * 60 * 1000)
    }
    return DEFAULT_GROUP_WINDOW_MS
}

let runtime = null
let shutdownHooksRegistered = false

/**
 * Builds the line-item rows for one order. Real lineItems are passed through
 * with raw `qty`/`unit` so the Handlebars template can render via `phpAmount`
 * and `multiply` helpers; legacy rows (lineItems undefined) fall back to a
 * single synthetic row built from the order's `productName` / `itemsCount`,
 * relying on the `cleanProductName` helper to strip `×N` decorations.
 */
const buildEmailLineItems = (order) => {
    const lines = Array.isArray(order.lineItems) ? order.lineItems : []
    if (lines.length > 0) {
        return lines.map((line) => ({
            name: String(line.name || 'Item'),
            qty: Math.max(1, Number(line.qty) || 1),
            unit: Number(line.unit) || 0,
            lineNotes: String(line.lineNotes || '')
        }))
    }
    const itemsCount = Math.max(1, Number(order.itemsCount) || 1)
    const amount = Number(order.amount) || 0
    return [
        {
            name: String(order.productName || 'Order'),
            qty: itemsCount,
            unit: itemsCount > 0 ? amount / itemsCount : amount,
            lineNotes: ''
        }
    ]
}

const buildEmailPayload = ({ orders, business, tourist }) => {
    const grandTotal = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
    const isMultipleOrders = orders.length > 1
    const ordersForView = orders.map((order) => ({
        orderCode: order.orderCode,
        lineItems: buildEmailLineItems(order),
        amount: Number(order.amount) || 0
    }))

    const subject = isMultipleOrders
        ? `[TaraBisita] Your ${orders.length} orders from ${business.name} are ready`
        : `[TaraBisita] Your order from ${business.name} is ready`

    const html = templateReader('tourist-order-completion', {
        businessName: business.name || 'Your store',
        businessAddress: business.address || '',
        customerName: tourist?.name || orders[0]?.customerName || 'there',
        orderCount: orders.length,
        isMultipleOrders,
        orders: ordersForView,
        grandTotal
    })

    return { subject, html }
}

/**
 * Atomically reserves the email-send claim for the entire group: only one
 * job will succeed in flipping `completionEmailSentAt` for these rows from null,
 * preventing duplicate emails when several FINISHED transitions race.
 */
const claimGroupForEmail = async (orderIds, sentAt) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return 0
    const result = await CustomerOrder.updateMany(
        { _id: { $in: orderIds }, completionEmailSentAt: null },
        { $set: { completionEmailSentAt: sentAt } }
    )
    return result?.modifiedCount || 0
}

/** Used when sending fails so the job can re-run; we drop the claim only if it was just set. */
const releaseGroupClaim = async (orderIds, sentAt) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return
    await CustomerOrder.updateMany(
        { _id: { $in: orderIds }, completionEmailSentAt: sentAt },
        { $set: { completionEmailSentAt: null } }
    )
}

const handleTouristOrderCompletionEmailJob = async (job) => {
    const orderIdRaw = job?.attrs?.data?.orderId
    const orderId = String(orderIdRaw || '').trim()
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return
    }

    const triggerOrder = await CustomerOrder.findById(orderId).lean()
    if (!triggerOrder) return
    if (triggerOrder.status !== 'FINISHED') return
    if (triggerOrder.completionEmailSentAt) return
    if (!triggerOrder.placedByUserId) return

    const groupWindowMs = getGroupWindowMs()
    const triggerCreatedAt = new Date(triggerOrder.createdAt).getTime()
    if (!Number.isFinite(triggerCreatedAt)) return
    const groupStart = new Date(triggerCreatedAt - groupWindowMs)
    const groupEnd = new Date(triggerCreatedAt + groupWindowMs)

    const groupOrders = await CustomerOrder.find({
        placedByUserId: triggerOrder.placedByUserId,
        businessId: triggerOrder.businessId,
        completionEmailSentAt: null,
        createdAt: { $gte: groupStart, $lte: groupEnd }
    })
        .sort({ createdAt: 1 })
        .lean()

    if (!groupOrders.length) return

    const allFinished = groupOrders.every((order) => order.status === 'FINISHED')
    if (!allFinished) return

    const [tourist, business] = await Promise.all([
        User.findById(triggerOrder.placedByUserId).select('name email').lean(),
        Business.findById(triggerOrder.businessId).select('name address').lean()
    ])
    if (!tourist?.email) return
    if (!business) return

    const sentAt = new Date()
    const orderIds = groupOrders.map((row) => row._id)
    const claimedCount = await claimGroupForEmail(orderIds, sentAt)
    if (claimedCount === 0) {
        return
    }

    try {
        const { subject, html } = buildEmailPayload({ orders: groupOrders, business, tourist })
        await sendMailer(tourist.email, subject, html)
        console.log(
            `[tourist-order-completion-email] sent to ${tourist.email} for ${groupOrders.length} order(s) at ${business.name}`
        )
    } catch (error) {
        await releaseGroupClaim(orderIds, sentAt).catch(() => {})
        console.error(
            '[tourist-order-completion-email] send failed; reverted claim',
            error?.message || error
        )
        throw error
    }
}

const registerShutdownHooksOnce = () => {
    if (shutdownHooksRegistered) return
    shutdownHooksRegistered = true
    const stop = () => {
        void stopTouristOrderCompletionEmailJob().catch((err) =>
            console.error('[tourist-order-completion-email] shutdown error', err?.message || err)
        )
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
}

export const stopTouristOrderCompletionEmailJob = async () => {
    if (!runtime) return
    const { agenda } = runtime
    runtime = null
    await agenda.stop(false)
}

export const startTouristOrderCompletionEmailJob = async () => {
    if (String(process.env.ORDER_COMPLETION_EMAIL_DISABLED || '').trim() === '1') {
        return
    }
    if (runtime) return

    if (mongoose.connection.readyState !== 1) {
        console.log('[tourist-order-completion-email] skipped (MongoDB not connected)')
        return
    }

    const db = mongoose.connection.db
    if (!db) {
        console.log('[tourist-order-completion-email] skipped (no MongoDB handle)')
        return
    }

    const agenda = new Agenda({
        backend: new MongoBackend({
            mongo: db,
            collection: 'touristOrderCompletionAgendaJobs'
        }),
        defaultConcurrency: 2,
        maxConcurrency: 4
    })

    agenda.on('error', (err) => {
        console.error('[tourist-order-completion-email] agenda error', err?.message || err)
    })

    agenda.define(JOB_NAME, async (job) => {
        try {
            await handleTouristOrderCompletionEmailJob(job)
        } catch (err) {
            console.error('[tourist-order-completion-email] job error', err?.message || err)
            throw err
        }
    }, { concurrency: 2 })

    try {
        await agenda.start()
    } catch (err) {
        console.error('[tourist-order-completion-email] failed to start', err?.message || err)
        await agenda.stop(false).catch(() => {})
        return
    }

    runtime = { agenda }
    registerShutdownHooksOnce()
}

/**
 * Schedules a debounced job for the given order id; safe no-op if the job
 * runtime is not started yet (e.g., during tests or before boot completes).
 */
export const scheduleTouristOrderCompletionEmailForOrder = async (orderId) => {
    if (!runtime?.agenda) return
    const id = String(orderId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) return
    try {
        await runtime.agenda.schedule(SCHEDULE_DEBOUNCE_LABEL, JOB_NAME, { orderId: id })
    } catch (err) {
        console.error(
            '[tourist-order-completion-email] failed to schedule for order',
            id,
            err?.message || err
        )
    }
}
