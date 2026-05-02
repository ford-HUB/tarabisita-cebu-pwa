import SubscriptionCatalog from './SubscriptionCatalog.model.js'
import {
    defaultSubscriptionCatalog,
    fallbackBillingPlanByMonths,
    legacyPlanIdByMonths
} from './subscriptionCatalog.defaults.js'

const clone = (value) => structuredClone(value)

export const getResolvedCatalog = async () => {
    const doc = await SubscriptionCatalog.findOne({ key: 'default' }).lean()
    if (!doc || !Array.isArray(doc.pricing) || doc.pricing.length === 0) {
        return clone(defaultSubscriptionCatalog)
    }
    const base = defaultSubscriptionCatalog
    return {
        pricing: clone(doc.pricing),
        benefits: Array.isArray(doc.benefits) && doc.benefits.length ? clone(doc.benefits) : clone(base.benefits),
        columns: Array.isArray(doc.columns) && doc.columns.length ? clone(doc.columns) : clone(base.columns),
        rows: Array.isArray(doc.rows) && doc.rows.length ? clone(doc.rows) : clone(base.rows),
        freeTier: Array.isArray(doc.freeTier) && doc.freeTier.length ? clone(doc.freeTier) : clone(base.freeTier)
    }
}

export const upsertSubscriptionCatalog = async (payload) => {
    const setDoc = {
        key: 'default',
        pricing: payload.pricing,
        benefits: payload.benefits,
        columns: payload.columns,
        rows: payload.rows,
        freeTier: payload.freeTier
    }
    await SubscriptionCatalog.findOneAndUpdate({ key: 'default' }, { $set: setDoc }, { upsert: true, new: true })
}

/**
 * Resolves PayMongo line item title/amount and metadata planId for a prepaid duration.
 * Uses DB catalog when valid; falls back to hard-coded amounts for reliability.
 */
export const resolveBillingPlanForCheckout = async (months) => {
    const m = Number(months)
    const legacyId = legacyPlanIdByMonths[m]
    const fallback = fallbackBillingPlanByMonths[m]
    if (!legacyId || !fallback) {
        return null
    }

    let catalog
    try {
        catalog = await getResolvedCatalog()
    } catch (_error) {
        return fallback
    }

    const row = (catalog.pricing || []).find((p) => Number(p.months) === m)
    const amount = row ? Number(row.totalAmount) : NaN
    const title = row && String(row.title || '').trim() ? String(row.title).trim() : fallback.title

    if (!Number.isFinite(amount) || amount <= 0) {
        return { id: legacyId, title: fallback.title, amount: fallback.amount }
    }

    return { id: legacyId, title, amount }
}
