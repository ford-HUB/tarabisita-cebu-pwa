import Payment, { PAYMENT_TYPES } from '../../business/billing/models/payment.model.js'
import BusinessSubscription from '../../business/billing/models/business-subscription.model.js'

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
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        subscriptionEndsAt
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
