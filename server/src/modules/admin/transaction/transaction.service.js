import mongoose from 'mongoose'
import Payment, { PAYMENT_TYPES } from '../../business/billing/models/payment.model.js'
import BusinessSubscription from '../../business/billing/models/business-subscription.model.js'
import Business from '../../business/models/business.model.js'
import ActivityLog from '../../auth/models/activity-log.model.js'
import { sendMailer } from '../../auth/auth.service.js'

/** Admin UI no longer surfaces `REJECTED`; legacy rows read as cancelled. */
const normalizeAdminTransactionStatus = (status) => {
    const s = String(status || '').trim().toUpperCase()
    if (s === 'REJECTED') return 'CANCELLED'
    return s || 'PENDING'
}

const serializeAdminPlanSubscriptionPayment = (payment, subscriptionById = {}) => {
    const businessDoc = payment.businessId && typeof payment.businessId === 'object' ? payment.businessId : null
    const userDoc = payment.userId && typeof payment.userId === 'object' ? payment.userId : null
    const subKey = payment.subscriptionRecordId ? String(payment.subscriptionRecordId) : ''
    const subscriptionEndsAt =
        subKey && subscriptionById[subKey]?.expiresAt != null ? subscriptionById[subKey].expiresAt : null
    const ref = String(payment.requestReferenceNumber || '').trim()
    const orderId = ref.length > 0 ? ref : `#${String(payment._id).slice(-6).toUpperCase()}`

    return {
        id: String(payment._id),
        orderId,
        businessName: businessDoc?.name || '—',
        customerName: userDoc?.name || '—',
        email: userDoc?.email || '—',
        amount: payment.amount,
        currency: payment.currency || 'PHP',
        planId: payment.planId || '',
        months: payment.months,
        status: normalizeAdminTransactionStatus(payment.status),
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        subscriptionEndsAt
    }
}

const computeSubscriptionExpiresAt = (startedAt, months) => {
    const end = new Date(startedAt.getTime())
    end.setMonth(end.getMonth() + Math.max(0, Number(months) || 0))
    return end
}

const escapeHtml = (s) =>
    String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const subscriptionRecency = (s) => {
    const c = s?.createdAt ? new Date(s.createdAt).getTime() : 0
    const t = s?.startedAt ? new Date(s.startedAt).getTime() : 0
    return Math.max(c, t)
}

const resolvePendingSubscriptionForPayment = async (payment, business) => {
    const bid = payment.businessId
    const checkout = String(payment.checkoutSessionId || '').trim()

    if (business?.billingSubscriptionId) {
        const s = await BusinessSubscription.findById(business.billingSubscriptionId)
        if (s && s.status === 'PENDING_CHECKOUT' && String(s.checkoutSessionId || '').trim() === checkout) {
            return s
        }
    }
    if (checkout) {
        const byCheckout = await BusinessSubscription.findOne({
            businessId: bid,
            checkoutSessionId: checkout,
            status: 'PENDING_CHECKOUT'
        })
        if (byCheckout) return byCheckout
    }
    return BusinessSubscription.findOne({ businessId: bid, status: 'PENDING_CHECKOUT' }).sort({ createdAt: -1 })
}

const notifyOwnerPaymentDecision = async ({ payment, business, accepted, reason }) => {
    const userDoc = payment.userId && typeof payment.userId === 'object' ? payment.userId : null
    const toEmail = String(userDoc?.email || '').trim()
    if (!toEmail) return

    const businessName = escapeHtml(
        (business && typeof business.name === 'string' && business.name) || 'Your business'
    )
    const ownerName = escapeHtml(String(userDoc?.name || '').trim() || 'there')
    const orderRef = escapeHtml(
        String(payment.requestReferenceNumber || '').trim() || String(payment._id).slice(-8).toUpperCase()
    )
    const amount = escapeHtml(String(payment.amount ?? ''))
    const currency = escapeHtml(String(payment.currency || 'PHP'))

    const intro = accepted
        ? `<p>Hi ${ownerName},</p><p>Your plan subscription payment for <strong>${businessName}</strong> has been <strong>approved</strong> and marked as paid.</p>`
        : `<p>Hi ${ownerName},</p><p>Your plan subscription payment for <strong>${businessName}</strong> was <strong>not approved</strong>.</p>`

    const reasonBlock =
        !accepted && String(reason || '').trim()
            ? `<p style="margin-top:12px;"><strong>Note from admin:</strong><br/><span style="white-space:pre-wrap;">${escapeHtml(
                  String(reason).trim()
              )}</span></p>`
            : ''

    const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#222;">
${intro}
<p style="margin-top:12px;">Reference: <strong>${orderRef}</strong><br/>Amount: <strong>${currency} ${amount}</strong></p>
${reasonBlock}
<hr style="border:none;border-top:1px solid #e5dfd6;margin:20px 0;" />
<p style="margin:0;font-size:12px;color:#666;">This message was sent from TaraBisita billing administration.</p>
</body></html>`

    const subject = accepted
        ? 'Your TaraBisita subscription payment was approved'
        : 'Update on your TaraBisita subscription payment'
    await sendMailer(toEmail, subject, html)
}

const logAdminPaymentReview = async ({ adminUserId, businessId, paymentId, action, details = {} }) => {
    try {
        await ActivityLog.create({
            actorUserId: adminUserId,
            actorRole: 'ADMIN',
            scopeType: 'BUSINESS',
            scopeId: businessId,
            action,
            category: 'BILLING',
            severity: 'INFO',
            status: 'SUCCESS',
            description: `Admin ${action.replace(/_/g, ' ').toLowerCase()} for payment ${paymentId}`,
            details: { paymentId: String(paymentId), ...details }
        })
    } catch {
        // best-effort
    }
}

/** Ledger of plan subscription payments (PayMongo checkout) across businesses. */
export const listAdminPlanSubscriptionTransactions = async ({ days = '7', status = 'ALL' } = {}) => {
    const match = {
        type: PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION
    }

    if (status && status !== 'ALL') {
        match.status = status
    }

    if (days !== 'all') {
        const n = Math.min(Math.max(parseInt(String(days), 10) || 7, 1), 3650)
        match.createdAt = { $gte: new Date(Date.now() - n * 86400000) }
    }

    const payments = await Payment.find(match)
        .sort({ createdAt: -1 })
        .limit(500)
        .populate('businessId', 'name')
        .populate('userId', 'name email')
        .lean()

    const subObjectIds = payments.map((p) => p.subscriptionRecordId).filter(Boolean)
    let subscriptionById = {}
    if (subObjectIds.length) {
        const subs = await BusinessSubscription.find({ _id: { $in: subObjectIds } })
            .select('expiresAt')
            .lean()
        subscriptionById = Object.fromEntries(subs.map((s) => [String(s._id), s]))
    }

    return payments.map((p) => serializeAdminPlanSubscriptionPayment(p, subscriptionById))
}

export const getAdminPlanSubscriptionPaymentDetailById = async (paymentId) => {
    const id = String(paymentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    const p = await Payment.findById(id)
        .populate('businessId', 'name contact_info address website')
        .populate('userId', 'name email')
        .populate('adminReviewedByUserId', 'name email')
        .lean()

    if (!p || p.type !== PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION) return null

    const subKey = p.subscriptionRecordId ? String(p.subscriptionRecordId) : ''
    let subscriptionEndsAt = null
    let subscriptionStatus = null
    if (subKey) {
        const s = await BusinessSubscription.findById(subKey).select('expiresAt status').lean()
        subscriptionEndsAt = s?.expiresAt || null
        subscriptionStatus = s?.status || null
    }

    const biz = p.businessId && typeof p.businessId === 'object' ? p.businessId : null
    const user = p.userId && typeof p.userId === 'object' ? p.userId : null
    const ref = String(p.requestReferenceNumber || '').trim()
    const orderId = ref.length > 0 ? ref : `#${String(p._id).slice(-6).toUpperCase()}`

    return {
        id: String(p._id),
        orderId,
        status: normalizeAdminTransactionStatus(p.status),
        amount: p.amount,
        currency: p.currency || 'PHP',
        planId: p.planId || '',
        months: p.months,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        checkoutSessionId: p.checkoutSessionId || '',
        requestReferenceNumber: p.requestReferenceNumber || '',
        xenditPaymentId: p.xenditPaymentId || '',
        notes: p.notes || '',
        proofReceiptUrl: String(p.proofReceiptUrl || '').trim(),
        declineReason: String(p.declineReason || '').trim(),
        adminReviewedAt: p.adminReviewedAt || null,
        adminReviewedByName: p.adminReviewedByUserId?.name || null,
        business: {
            id: biz?._id ? String(biz._id) : '',
            name: biz?.name || '—',
            phone: String(biz?.contact_info?.phone || '').trim() || '—',
            address: String(biz?.address || '').trim() || '—',
            website: String(biz?.website || '').trim() || '—'
        },
        owner: {
            name: user?.name || '—',
            email: user?.email || '—'
        },
        subscriptionEndsAt,
        subscriptionStatus
    }
}

export const approvePlanSubscriptionPaymentByAdmin = async (paymentId, adminUserId) => {
    const id = String(paymentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('INVALID_PAYMENT_ID')
    }
    const oid = new mongoose.Types.ObjectId(id)

    const payment = await Payment.findById(oid)
    if (!payment || payment.type !== PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION) {
        throw new Error('NOT_FOUND')
    }
    if (payment.status !== 'PENDING') {
        throw new Error('NOT_PENDING')
    }

    const business = await Business.findById(payment.businessId)
    if (!business) {
        throw new Error('BUSINESS_NOT_FOUND')
    }

    const subDoc = await resolvePendingSubscriptionForPayment(payment, business)
    if (!subDoc) {
        throw new Error('NO_PENDING_SUBSCRIPTION')
    }

    const newerActive = await BusinessSubscription.findOne({
        businessId: business._id,
        status: 'ACTIVE',
        _id: { $ne: subDoc._id }
    })
        .sort({ createdAt: -1 })
        .lean()

    if (newerActive && subscriptionRecency(newerActive) > subscriptionRecency(subDoc)) {
        throw new Error('CONFLICT_NEWER_SUBSCRIPTION')
    }

    const startedAt = new Date()
    const expiresAt = computeSubscriptionExpiresAt(startedAt, subDoc.months)
    const checkoutRef = String(payment.checkoutSessionId || '').trim()

    await BusinessSubscription.updateMany({ businessId: business._id, status: 'ACTIVE' }, { $set: { status: 'SUPERSEDED' } })

    const periodFields = BusinessSubscription.buildPeriodFields(startedAt, expiresAt)
    await BusinessSubscription.updateOne(
        { _id: subDoc._id },
        {
            $set: {
                status: 'ACTIVE',
                paymentId: payment._id,
                startedAt,
                expiresAt,
                ...periodFields,
                xenditCheckoutId: checkoutRef || subDoc.xenditCheckoutId || ''
            }
        }
    )

    await Payment.updateOne(
        { _id: payment._id },
        {
            $set: {
                status: 'PAID',
                paidAt: startedAt,
                subscriptionRecordId: subDoc._id,
                adminReviewedAt: new Date(),
                adminReviewedByUserId: adminUserId,
                declineReason: ''
            }
        }
    )

    business.billingSubscriptionId = subDoc._id
    business.billing = {
        lastAmount: payment.amount ?? null,
        lastStatus: 'PAID',
        lastPaidAt: startedAt
    }
    business.subscription = {
        ...(business.subscription || {}),
        status: 'ACTIVE',
        planId: payment.planId || null,
        months: payment.months ?? null,
        amount: payment.amount ?? null,
        startedAt,
        expiresAt,
        paymentId: checkoutRef || null,
        requestReferenceNumber: payment.requestReferenceNumber || business.subscription?.requestReferenceNumber || null
    }
    business.updatedAt = new Date()
    await business.save()

    const populatedPayment = await Payment.findById(payment._id).populate('userId', 'name email').lean()
    await notifyOwnerPaymentDecision({
        payment: populatedPayment || payment.toObject(),
        business,
        accepted: true,
        reason: ''
    })

    await logAdminPaymentReview({
        adminUserId,
        businessId: business._id,
        paymentId: payment._id,
        action: 'ADMIN_PLAN_PAYMENT_APPROVED',
        details: { subscriptionId: String(subDoc._id) }
    })

    return { id: String(payment._id), status: 'PAID' }
}

export const rejectPlanSubscriptionPaymentByAdmin = async (paymentId, adminUserId, reason = '') => {
    const id = String(paymentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('INVALID_PAYMENT_ID')
    }
    const oid = new mongoose.Types.ObjectId(id)

    const payment = await Payment.findById(oid)
    if (!payment || payment.type !== PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION) {
        throw new Error('NOT_FOUND')
    }
    if (payment.status !== 'PENDING') {
        throw new Error('NOT_PENDING')
    }

    const business = await Business.findById(payment.businessId)
    if (!business) {
        throw new Error('BUSINESS_NOT_FOUND')
    }

    const subDoc = await resolvePendingSubscriptionForPayment(payment, business)
    if (subDoc) {
        await BusinessSubscription.updateOne({ _id: subDoc._id }, { $set: { status: 'FAILED' } })
    }

    const trimmedReason = String(reason || '').trim().slice(0, 2000)

    await Payment.updateOne(
        { _id: payment._id },
        {
            $set: {
                status: 'REJECTED',
                adminReviewedAt: new Date(),
                adminReviewedByUserId: adminUserId,
                declineReason: trimmedReason
            }
        }
    )

    business.billing = {
        lastAmount: payment.amount ?? business.billing?.lastAmount ?? null,
        lastStatus: 'FAILED',
        lastPaidAt: business.billing?.lastPaidAt || null
    }
    business.subscription = {
        ...(business.subscription || {}),
        status: 'FAILED',
        paymentId: payment.checkoutSessionId || business.subscription?.paymentId || null,
        requestReferenceNumber: payment.requestReferenceNumber || business.subscription?.requestReferenceNumber || null
    }
    business.updatedAt = new Date()
    await business.save()

    const populatedPayment = await Payment.findById(payment._id).populate('userId', 'name email').lean()
    await notifyOwnerPaymentDecision({
        payment: populatedPayment || payment.toObject(),
        business,
        accepted: false,
        reason: trimmedReason
    })

    await logAdminPaymentReview({
        adminUserId,
        businessId: business._id,
        paymentId: payment._id,
        action: 'ADMIN_PLAN_PAYMENT_REJECTED',
        details: { reason: trimmedReason || null }
    })

    return { id: String(payment._id), status: 'REJECTED' }
}
