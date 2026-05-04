import mongoose from 'mongoose'
import Business from '../business/models/business.model.js'
import CustomerOrder from '../business/customer-orders/models/customer-order.model.js'
import Payment, { PAYMENT_TYPES } from '../business/billing/models/payment.model.js'
import BusinessSubscription from '../business/billing/models/business-subscription.model.js'
import User from '../auth/models/user.model.js'
import ActivityLog from '../auth/models/activity-log.model.js'
import PaymongoWebhookEvent from './models/paymongo-webhook-event.model.js'
import cloudinary from '../../configs/cloudinary.js'
import bcrypt from 'bcrypt'
import { sendMailer } from '../auth/auth.service.js'
import { templateReader } from '../../shared/utils/templateReaderExtractor.js'
import {
    buildSignedBusinessBillingReturnUrl,
    buildSignedTouristCheckoutReturnUrl
} from '../../shared/utils/routeSignature.utils.js'
import TouristMenuOrderCheckout from '../tourist/menu-order-checkout/menu-order-checkout.model.js'
import { removeTouristCartItemsForBusiness } from '../tourist/tourist-cart-item/tourist-cart-item.service.js'
import { resolveBillingPlanForCheckout } from '../admin/manage-subscription/manage-subscription.service.js'
import { BUSINESS_CATEGORY_LABELS } from '../../shared/constants/businessCategories.js'

const extractPublicBusiness = (business) => ({
    _id: business._id,
    name: business.name,
    description: business.description,
    address: business.address,
    contact_info: business.contact_info,
    website: business.website,
    logo: business.logo,
    businessLocation: business.businessLocation,
    coverImage: business.coverImage,
    banner: business.banner || business.coverImage,
    socialMedia: business.socialMedia,
    themeColor: business.themeColor || '#ff7a1a',
    category: business.category,
    verificationStatus: business.verificationStatus
})

const extractMenuItem = (menuItem) => ({
    id: String(menuItem._id),
    name: menuItem.name,
    description: menuItem.description,
    flavor: menuItem.flavor,
    price: menuItem.price,
    category: menuItem.category || '',
    preparationTime: menuItem.preparationTime || '',
    servingSize: menuItem.servingSize || '',
    spiceLevel: menuItem.spiceLevel || 'No Spice',
    allergens: menuItem.allergens || '',
    isAvailable: Boolean(menuItem.isAvailable),
    stockStatus: menuItem.stockStatus || (menuItem.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK'),
    isDeleted: Boolean(menuItem.isDeleted),
    deletedAt: menuItem.deletedAt || null,
    images: Array.isArray(menuItem.images) ? menuItem.images : [],
    createdAt: menuItem.createdAt
})

const findBusinessByUserId = async (userId) => {
    const business = await Business.findOne({ userId }).populate('category')
    if (!business) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    return business
}

const extractActivityLog = (activityLog) => ({
    id: String(activityLog._id),
    actorRole: activityLog.actorRole,
    scopeType: activityLog.scopeType,
    scopeId: activityLog.scopeId ? String(activityLog.scopeId) : null,
    action: activityLog.action,
    category: activityLog.category,
    severity: activityLog.severity,
    status: activityLog.status,
    description: activityLog.description,
    details: activityLog.details || {},
    ipAddress: activityLog.ipAddress || '',
    userAgent: activityLog.userAgent || '',
    device: activityLog.device || '',
    failureReason: activityLog.failureReason || '',
    createdAt: activityLog.createdAt
})

const buildPaymentReferenceNumber = ({ businessId, planId }) => {
    const businessSuffix = String(businessId || '').slice(-8).toUpperCase()
    const planSuffix = String(planId || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()
    const timeSuffix = Date.now().toString().slice(-10)
    const candidate = `TB${businessSuffix}${planSuffix}${timeSuffix}`
    return candidate.slice(0, 36)
}

const getPaymongoCheckoutBaseUrl = () =>
    readFirstEnv(['PAYMONGO_CHECKOUT_URL']) || 'https://api.paymongo.com/v1/checkout_sessions'

const readFirstEnv = (keys = []) =>
    keys.map((key) => process.env[key]).find((value) => typeof value === 'string' && value.trim())?.trim() || ''

const normalizeSecretKey = (value) =>
    String(value || '')
        .replace(/^\uFEFF/, '')
        .trim()

const getPaymongoSecretKey = () =>
    normalizeSecretKey(readFirstEnv(['PAYMONGO_SECRET_KEY', 'PAYMONGO_SK']))

const getPaymongoApiBaseUrl = () =>
    readFirstEnv(['PAYMONGO_API_BASE_URL']) || 'https://api.paymongo.com/v1'

const normalizePublicBaseUrl = (value = '') => {
    const trimmed = String(value || '').trim().replace(/\/+$/, '')
    if (!trimmed) {
        return ''
    }
    if (!/^https?:\/\//i.test(trimmed)) {
        return ''
    }
    return trimmed
}

const joinPublicUrl = (baseUrl, pathWithQuery) => {
    const base = normalizePublicBaseUrl(baseUrl)
    const path = String(pathWithQuery || '').startsWith('/')
        ? String(pathWithQuery)
        : `/${pathWithQuery}`
    if (!base) {
        return ''
    }
    return `${base}${path}`
}

/** End of prepaid period: same calendar day and clock time, N months later. */
const computeSubscriptionExpiresAt = (startedAt, months) => {
    const end = new Date(startedAt.getTime())
    end.setMonth(end.getMonth() + Math.max(0, Number(months) || 0))
    return end
}

/** True while a prepaid period is still in effect (blocks starting another checkout for a different term). */
const isBusinessSubscriptionInActivePaidWindow = (business) => {
    const sub = business.subscription || {}
    if (sub.status !== 'ACTIVE') {
        return false
    }
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return true
    }
    return expiresAt.getTime() > Date.now()
}

const buildSubscriptionProfilePayload = (business) => {
    const sub = business.subscription || {}
    const expiresAt = sub.expiresAt || null
    const rawStatus = sub.status || 'INACTIVE'
    let effectiveStatus = rawStatus
    if (rawStatus === 'ACTIVE' && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        effectiveStatus = 'EXPIRED'
    }

    return {
        status: rawStatus,
        effectiveStatus,
        planId: sub.planId ?? null,
        months: sub.months ?? null,
        amount: sub.amount ?? null,
        startedAt: sub.startedAt || null,
        expiresAt: sub.expiresAt || null,
        planChangeLocked: isBusinessSubscriptionInActivePaidWindow(business)
    }
}

const buildBillingSummaryPayload = (business) => {
    const b = business.billing || {}
    const sid = business.billingSubscriptionId || b.currentSubscriptionRecordId
    return {
        lastAmount: b.lastAmount ?? null,
        lastStatus: b.lastStatus || 'NONE',
        lastPaidAt: b.lastPaidAt || null,
        billingSubscriptionId: sid ? String(sid) : null,
        currentSubscriptionRecordId: sid ? String(sid) : null
    }
}

const mapSessionToPaymentStatus = (mappedStatus) => {
    if (mappedStatus === 'SUCCESS') {
        return 'PAID'
    }
    if (mappedStatus === 'FAILED') {
        return 'FAILED'
    }
    if (mappedStatus === 'CANCELLED') {
        return 'CANCELLED'
    }
    return 'PENDING'
}

const serializeLedgerPayment = (p) => ({
    id: String(p._id),
    type: p.type,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    planId: p.planId,
    months: p.months,
    checkoutSessionId: p.checkoutSessionId,
    paymongoPaymentId: p.paymongoPaymentId,
    requestReferenceNumber: p.requestReferenceNumber,
    subscriptionRecordId: p.subscriptionRecordId ? String(p.subscriptionRecordId) : null,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
})

const serializeLedgerSubscription = (s) => ({
    id: String(s._id),
    planId: s.planId,
    months: s.months,
    amount: s.amount,
    currency: s.currency,
    status: s.status,
    checkoutSessionId: s.checkoutSessionId || '',
    startedAt: s.startedAt,
    expiresAt: s.expiresAt,
    period: {
        start: {
            year: s.startYear,
            month: s.startMonth,
            day: s.startDay,
            hour: s.startHour,
            minute: s.startMinute
        },
        end: {
            year: s.endYear,
            month: s.endMonth,
            day: s.endDay,
            hour: s.endHour,
            minute: s.endMinute
        }
    },
    paymongoCheckoutId: s.paymongoCheckoutId,
    requestReferenceNumber: s.requestReferenceNumber,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
})

/** Pre-fills PayMongo hosted checkout (esp. card billing) from business profile + owner. */
const buildPaymongoBillingPayload = (user, business) => {
    const name = String(user?.name || '').trim()
    const email = String(user?.email || '').trim()
    const phone = String(business?.contact_info?.phone || '').trim()
    const line1 = String(business?.address || '').trim()
    const businessName = String(business?.name || '').trim()

    if (!email && !name && !line1 && !phone) {
        return null
    }

    const billing = {
        name: name || businessName || email || 'Customer',
        email: email || undefined,
        phone: phone || undefined,
        address: {
            line1: line1 || businessName || name || 'Philippines',
            line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'PH'
        }
    }

    if (!billing.email) {
        delete billing.email
    }
    if (!billing.phone) {
        delete billing.phone
    }

    return billing
}

export const createBusinessBillingCheckoutSessionByUserId = async (userId, months, { returnBaseUrl } = {}) => {
    const business = await findBusinessByUserId(userId)
    if (isBusinessSubscriptionInActivePaidWindow(business)) {
        throw new Error('BILLING_PLAN_LOCKED_UNTIL_EXPIRY')
    }
    const user = await User.findById(userId).select('name email')

    const selectedPlan = await resolveBillingPlanForCheckout(months)
    if (!selectedPlan) {
        throw new Error('INVALID_BILLING_MONTHS')
    }

    const paymongoSecretKey = getPaymongoSecretKey()
    if (!paymongoSecretKey) {
        throw new Error('PAYMONGO_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!paymongoSecretKey.startsWith('sk_')) {
        throw new Error('PAYMONGO_SECRET_KEY_INVALID')
    }

    const checkoutEndpoint = getPaymongoCheckoutBaseUrl()
    if (!checkoutEndpoint) {
        throw new Error('PAYMONGO_CHECKOUT_URL_NOT_CONFIGURED')
    }

    const clientBaseUrl = normalizePublicBaseUrl(
        returnBaseUrl || readFirstEnv(['PAYMONGO_RETURN_BASE_URL', 'CLIENT_URL'])
    )
    if (!clientBaseUrl) {
        throw new Error('CHECKOUT_RETURN_BASE_URL_INVALID')
    }
    const referenceNumber = buildPaymentReferenceNumber({
        businessId: business._id,
        planId: selectedPlan.id
    })
    const successUrl = buildSignedBusinessBillingReturnUrl(clientBaseUrl, {
        payment: 'success',
        planId: selectedPlan.id
    })
    const cancelUrl = buildSignedBusinessBillingReturnUrl(clientBaseUrl, {
        payment: 'cancelled',
        planId: selectedPlan.id
    })
    if (!successUrl || !cancelUrl) {
        throw new Error('CHECKOUT_RETURN_URLS_INVALID')
    }

    const amountInCentavos = Math.round(Number(selectedPlan.amount) * 100)
    const enabledPaymentMethods = readFirstEnv(['PAYMONGO_PAYMENT_METHOD_TYPES'])
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)

    const paymentMethodTypes = enabledPaymentMethods.length
        ? enabledPaymentMethods
        : ['card', 'gcash', 'paymaya', 'grab_pay']

    const billing = buildPaymongoBillingPayload(user, business)

    const payload = {
        data: {
            attributes: {
                reference_number: referenceNumber,
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
                description: `${months}-month business billing subscription`,
                line_items: [
                    {
                        currency: 'PHP',
                        amount: amountInCentavos,
                        name: selectedPlan.title,
                        quantity: 1,
                        description: `${months}-month billing access`
                    }
                ],
                payment_method_types: paymentMethodTypes,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    businessId: String(business._id),
                    planId: String(selectedPlan.id),
                    months: String(months),
                    amount: String(selectedPlan.amount),
                    requestReferenceNumber: String(referenceNumber),
                    ownerEmail: String(user?.email || '')
                },
                ...(billing ? { billing } : {})
            }
        }
    }

    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${paymongoSecretKey}:`).toString('base64')}`
        },
        body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    const jsonResponse = (() => {
        try {
            return JSON.parse(responseText)
        } catch (_error) {
            return {}
        }
    })()

    const checkoutUrl = jsonResponse?.data?.attributes?.checkout_url
    const checkoutId = jsonResponse?.data?.id || ''
    if (!response.ok || !checkoutUrl) {
        const upstreamMessage =
            jsonResponse?.errors?.[0]?.detail ||
            jsonResponse?.errors?.[0]?.code ||
            jsonResponse?.errors?.[0]?.title ||
            jsonResponse?.message ||
            responseText ||
            'Unknown PayMongo upstream error'
        throw new Error(`PayMongo checkout create failed (${response.status}): ${upstreamMessage}`)
    }

    const checkoutData = {
        checkoutId,
        checkoutUrl,
        requestReferenceNumber: referenceNumber,
        months,
        amount: selectedPlan.amount,
        planId: selectedPlan.id
    }

    const subscriptionRow = await BusinessSubscription.create({
        businessId: business._id,
        userId: business.userId,
        paymentId: null,
        checkoutSessionId: checkoutData.checkoutId || '',
        planId: checkoutData.planId,
        months: checkoutData.months,
        amount: checkoutData.amount,
        currency: 'PHP',
        status: 'PENDING_CHECKOUT',
        startedAt: null,
        expiresAt: null,
        paymongoCheckoutId: '',
        requestReferenceNumber: checkoutData.requestReferenceNumber || ''
    })

    business.billingSubscriptionId = subscriptionRow._id
    business.billing = {
        lastAmount: selectedPlan.amount,
        lastStatus: 'PENDING',
        lastPaidAt: null
    }
    business.updatedAt = new Date()
    await business.save()

    try {
        await Payment.create({
            businessId: business._id,
            userId: business.userId,
            type: PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION,
            status: 'PENDING',
            amount: selectedPlan.amount,
            currency: 'PHP',
            planId: selectedPlan.id,
            months,
            checkoutSessionId: checkoutData.checkoutId || '',
            requestReferenceNumber: checkoutData.requestReferenceNumber || ''
        })
    } catch (_error) {
        // Avoid failing checkout if ledger row already exists
    }

    return checkoutData
}

export const registerPaymongoWebhook = async ({
    callbackUrl,
    events = ['checkout_session.payment.paid', 'payment.failed']
} = {}) => {
    const paymongoSecretKey = getPaymongoSecretKey()
    if (!paymongoSecretKey) {
        throw new Error('PAYMONGO_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!paymongoSecretKey.startsWith('sk_')) {
        throw new Error('PAYMONGO_SECRET_KEY_INVALID')
    }

    const serverPublicUrl = readFirstEnv(['SERVER_PUBLIC_URL', 'WEBHOOK_BASE_URL', 'NGROK_URL'])
    const resolvedCallbackUrl = callbackUrl || (serverPublicUrl ? `${serverPublicUrl}/api/v1/business/webhooks/paymongo` : '')
    if (!resolvedCallbackUrl) {
        throw new Error('PAYMONGO_WEBHOOK_CALLBACK_URL_NOT_CONFIGURED')
    }

    const apiBaseUrl = getPaymongoApiBaseUrl()
    const authHeader = `Basic ${Buffer.from(`${paymongoSecretKey}:`).toString('base64')}`

    const existingResponse = await fetch(`${apiBaseUrl}/webhooks`, {
        method: 'GET',
        headers: {
            Authorization: authHeader
        }
    })

    const existingJson = await existingResponse.json().catch(() => ({}))
    const existingHooks = Array.isArray(existingJson?.data) ? existingJson.data : []
    const existingMatch = existingHooks.find(
        (hook) => String(hook?.attributes?.url || '').trim() === resolvedCallbackUrl
    )
    if (existingMatch) {
        return {
            alreadyExists: true,
            webhookId: existingMatch.id,
            url: existingMatch?.attributes?.url || resolvedCallbackUrl,
            events: existingMatch?.attributes?.events || events,
            status: existingMatch?.attributes?.status || 'enabled'
        }
    }

    const createPayload = {
        data: {
            attributes: {
                url: resolvedCallbackUrl,
                events
            }
        }
    }

    const createResponse = await fetch(`${apiBaseUrl}/webhooks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader
        },
        body: JSON.stringify(createPayload)
    })

    const createText = await createResponse.text()
    const createJson = (() => {
        try {
            return JSON.parse(createText)
        } catch (_error) {
            return {}
        }
    })()

    if (!createResponse.ok) {
        const errorMessage =
            createJson?.errors?.[0]?.detail ||
            createJson?.errors?.[0]?.title ||
            createJson?.message ||
            createText ||
            'Failed to register PayMongo webhook'
        throw new Error(`PayMongo webhook registration failed (${createResponse.status}): ${errorMessage}`)
    }

    return {
        alreadyExists: false,
        webhookId: createJson?.data?.id || '',
        url: createJson?.data?.attributes?.url || resolvedCallbackUrl,
        events: createJson?.data?.attributes?.events || events,
        status: createJson?.data?.attributes?.status || 'enabled',
        secretKey: createJson?.data?.attributes?.secret_key || ''
    }
}

const resolveWebhookEventName = (payload = {}, headers = {}) =>
    String(
        payload?.data?.attributes?.type ||
        payload.type ||
        payload.event ||
        headers['x-paymongo-event'] ||
        ''
    ).toUpperCase()

const resolveWebhookStatus = (payload = {}) => {
    const innerAttrs = payload?.data?.attributes?.data?.attributes
    const payments = innerAttrs?.payments
    const firstPayStatus =
        Array.isArray(payments) && payments[0]?.attributes?.status
            ? String(payments[0].attributes.status).toUpperCase()
            : ''
    return String(
        firstPayStatus ||
            innerAttrs?.status ||
            payload?.data?.attributes?.status ||
            payload.status ||
            ''
    ).toUpperCase()
}

/** PayMongo nests the checkout session under `data.attributes.data` (JSON:API). */
const extractCheckoutSessionId = (payload = {}) => {
    const root = payload?.data?.attributes?.data
    if (!root || typeof root !== 'object') {
        return ''
    }

    const topId = String(root.id || '').trim()
    if (topId.startsWith('cs_')) {
        return topId
    }

    const attrs = root.attributes || {}
    const clientKey = String(attrs.client_key || '').trim()
    if (clientKey.startsWith('cs_') && clientKey.includes('_client_')) {
        return clientKey.split('_client_')[0]
    }

    const checkoutUrl = String(attrs.checkout_url || '')
    const m = checkoutUrl.match(/checkout\.paymongo\.com\/(cs_[a-zA-Z0-9_-]+)/i)
    if (m) {
        return m[1].split(/[#?/]/)[0]
    }

    return ''
}

/** Prefer checkout session id `cs_*` so it matches `BusinessSubscription.checkoutSessionId`. */
const resolveWebhookPaymentId = (payload = {}) => {
    const fromSession = extractCheckoutSessionId(payload)
    if (fromSession) {
        return fromSession
    }
    const cid = String(payload?.checkoutId || '').trim()
    if (cid.startsWith('cs_')) {
        return cid
    }
    return String(
        payload?.data?.attributes?.data?.id ||
            payload?.data?.attributes?.data?.attributes?.payment_intent_id ||
            payload.paymentId ||
            ''
    ).trim()
}

const resolveWebhookReferenceNumber = (payload = {}) => {
    const innerAttrs = payload?.data?.attributes?.data?.attributes || {}
    const payments = innerAttrs.payments
    let fromPaymentMeta = ''
    if (Array.isArray(payments) && payments[0]?.attributes?.metadata?.requestReferenceNumber) {
        fromPaymentMeta = String(payments[0].attributes.metadata.requestReferenceNumber).trim()
    }
    return String(
        innerAttrs?.metadata?.requestReferenceNumber ||
            fromPaymentMeta ||
            innerAttrs?.reference_number ||
            payload.requestReferenceNumber ||
            payload.request_reference_number ||
            ''
    ).trim()
}

const mapWebhookToSessionStatus = ({ eventName, status }) => {
    if (eventName.includes('CANCEL') || status.includes('CANCEL')) {
        return 'CANCELLED'
    }
    if (eventName.includes('FAIL') || status.includes('FAIL')) {
        return 'FAILED'
    }
    if (eventName.includes('SUCCESS') || status.includes('SUCCESS') || status.includes('PAID')) {
        return 'SUCCESS'
    }
    return 'PENDING'
}

const buildPaymongoDedupeKey = (payload = {}, headers = {}) => {
    const eventName = resolveWebhookEventName(payload, headers)
    const status = resolveWebhookStatus(payload)
    const paymentId = resolveWebhookPaymentId(payload)
    const requestReferenceNumber = resolveWebhookReferenceNumber(payload)
    const eventId = String(payload?.data?.id || payload?.id || '').trim()
    const dedupeKey = [
        eventId || 'UNKNOWN_EVENT_ID',
        eventName || 'UNKNOWN_EVENT',
        status || 'UNKNOWN_STATUS',
        paymentId || 'UNKNOWN_PAYMENT',
        requestReferenceNumber || 'UNKNOWN_REF'
    ].join('|')
    return { dedupeKey, eventName, status, paymentId, requestReferenceNumber, eventId }
}

/**
 * Applies stored PayMongo event JSON to Business billing, Payment, and BusinessSubscription.
 * Safe to call from live webhooks or from the reconcile job (idempotent when subscription already exists).
 */
export const syncBusinessLedgerFromPaymongoWebhookPayload = async (payload = {}, headers = {}) => {
    const { dedupeKey, eventName, status, paymentId, requestReferenceNumber } = buildPaymongoDedupeKey(
        payload,
        headers
    )

    const checkoutCsId =
        extractCheckoutSessionId(payload) ||
        (String(paymentId || '').startsWith('cs_') ? String(paymentId).trim() : '')

    const subOr = []
    if (requestReferenceNumber) {
        subOr.push({ requestReferenceNumber })
    }
    if (paymentId && String(paymentId).startsWith('cs_')) {
        subOr.push({ checkoutSessionId: String(paymentId).trim() })
    }
    if (checkoutCsId && (!paymentId || checkoutCsId !== paymentId)) {
        subOr.push({ checkoutSessionId: checkoutCsId })
    }

    let subDoc = subOr.length ? await BusinessSubscription.findOne({ $or: subOr }).sort({ createdAt: -1 }) : null

    if (!subDoc && paymentId && !String(paymentId).startsWith('cs_')) {
        const payLookup = await Payment.findOne({
            $or: [{ paymongoPaymentId: String(paymentId) }, { checkoutSessionId: String(paymentId) }]
        })
        if (payLookup?.subscriptionRecordId) {
            subDoc = await BusinessSubscription.findById(payLookup.subscriptionRecordId)
        }
        if (!subDoc && payLookup?.checkoutSessionId) {
            subDoc = await BusinessSubscription.findOne({ checkoutSessionId: payLookup.checkoutSessionId }).sort({
                createdAt: -1
            })
        }
    }

    let business = null
    let legacySession = null

    if (subDoc) {
        business = await Business.findById(subDoc.businessId)
    }

    if (!business) {
        business = await Business.findOne({
            $or: [
                { 'billingCheckoutSessions.checkoutId': paymentId },
                { 'billingCheckoutSessions.requestReferenceNumber': requestReferenceNumber }
            ]
        })
        if (business) {
            legacySession = (business.billingCheckoutSessions || []).find(
                (item) =>
                    (paymentId && item.checkoutId === paymentId) ||
                    (requestReferenceNumber && item.requestReferenceNumber === requestReferenceNumber)
            )
        }
    }

    if (!business) {
        return {
            dedupeKey,
            applied: false,
            reason: 'NO_MATCHING_BUSINESS',
            resolvedCheckoutSessionId: paymentId || checkoutCsId || null,
            resolvedRequestReferenceNumber: requestReferenceNumber || null
        }
    }

    if (!subDoc && !legacySession) {
        return {
            dedupeKey,
            applied: false,
            reason: 'NO_MATCHING_CHECKOUT_SESSION',
            resolvedCheckoutSessionId: paymentId || checkoutCsId || null,
            resolvedRequestReferenceNumber: requestReferenceNumber || null
        }
    }

    const sessionFromSub = subDoc
        ? {
              checkoutId: subDoc.checkoutSessionId || '',
              requestReferenceNumber: subDoc.requestReferenceNumber || '',
              planId: subDoc.planId,
              months: subDoc.months,
              amount: subDoc.amount,
              _fromSub: true
          }
        : null

    const effectiveSession = sessionFromSub || legacySession

    const mappedStatus = mapWebhookToSessionStatus({ eventName, status })

    if (legacySession) {
        legacySession.status = mappedStatus
        legacySession.updatedAt = new Date()
    }

    if (subDoc) {
        if (mappedStatus === 'CANCELLED' && subDoc.status === 'PENDING_CHECKOUT') {
            await BusinessSubscription.updateOne({ _id: subDoc._id }, { $set: { status: 'CANCELLED' } })
        } else if (mappedStatus === 'FAILED' && subDoc.status === 'PENDING_CHECKOUT') {
            await BusinessSubscription.updateOne({ _id: subDoc._id }, { $set: { status: 'FAILED' } })
        }
    }

    const paymentRowStatus = mapSessionToPaymentStatus(mappedStatus)
    const paymentOr = []
    if (paymentId) {
        paymentOr.push({ checkoutSessionId: paymentId })
    }
    if (checkoutCsId) {
        paymentOr.push({ checkoutSessionId: checkoutCsId })
    }
    if (requestReferenceNumber) {
        paymentOr.push({ requestReferenceNumber })
    }
    let paymentDoc = paymentOr.length ? await Payment.findOne({ $or: paymentOr }) : null

    if (!paymentDoc && effectiveSession) {
        paymentDoc = await Payment.create({
            businessId: business._id,
            userId: business.userId,
            type: PAYMENT_TYPES.BUSINESS_PLAN_SUBSCRIPTION,
            status: paymentRowStatus,
            amount: effectiveSession.amount ?? 0,
            currency: 'PHP',
            planId: effectiveSession.planId || '',
            months: effectiveSession.months,
            checkoutSessionId: effectiveSession.checkoutId || checkoutCsId || paymentId || '',
            paymongoPaymentId: paymentId && !String(paymentId).startsWith('cs_') ? String(paymentId) : '',
            requestReferenceNumber: requestReferenceNumber || effectiveSession.requestReferenceNumber || '',
            paidAt: paymentRowStatus === 'PAID' ? new Date() : null
        })
    } else if (paymentDoc) {
        const paySet = {
            status: paymentRowStatus,
            paymongoPaymentId:
                paymentId && !String(paymentId).startsWith('cs_')
                    ? String(paymentId)
                    : paymentDoc.paymongoPaymentId
        }
        if (paymentRowStatus === 'PAID') {
            paySet.paidAt = new Date()
        }
        if (requestReferenceNumber) {
            paySet.requestReferenceNumber = requestReferenceNumber
        }
        if (checkoutCsId && !paymentDoc.checkoutSessionId) {
            paySet.checkoutSessionId = checkoutCsId
        }
        await Payment.updateOne({ _id: paymentDoc._id }, { $set: paySet })
        paymentDoc = await Payment.findById(paymentDoc._id)
    }

    const resolvedCheckoutId =
        checkoutCsId ||
        String(effectiveSession?.checkoutId || '').trim() ||
        (String(paymentId || '').startsWith('cs_') ? paymentId : '')

    const checkoutRef =
        resolvedCheckoutId ||
        (String(paymentId || '').startsWith('cs_') ? String(paymentId) : '') ||
        ''
    const subPayId = String(business.subscription?.paymentId || '')
    const canTouchSubscriptionEmbed =
        !business.subscription ||
        business.subscription.status !== 'ACTIVE' ||
        (checkoutRef && subPayId === checkoutRef) ||
        (requestReferenceNumber &&
            String(business.subscription?.requestReferenceNumber || '') === String(requestReferenceNumber))

    if (mappedStatus === 'SUCCESS' && effectiveSession && paymentDoc?.subscriptionRecordId) {
        const existingSub = await BusinessSubscription.findById(paymentDoc.subscriptionRecordId)
        if (existingSub?.status === 'SUPERSEDED') {
            return { dedupeKey, applied: true, reason: 'IDEMPOTENT_SUBSCRIPTION_EXISTS' }
        }
        if (existingSub?.status === 'ACTIVE') {
            if (legacySession) {
                legacySession.status = 'SUCCESS'
                legacySession.updatedAt = new Date()
            }
            const paidAt = paymentDoc.paidAt ? new Date(paymentDoc.paidAt) : new Date()
            business.billing = {
                lastAmount: existingSub.amount ?? effectiveSession.amount ?? null,
                lastStatus: 'PAID',
                lastPaidAt: paidAt
            }
            business.billingSubscriptionId = existingSub._id
            business.subscription = {
                ...(business.subscription || {}),
                status: 'ACTIVE',
                planId: existingSub.planId || effectiveSession.planId || null,
                months: existingSub.months ?? effectiveSession.months ?? null,
                amount: existingSub.amount ?? effectiveSession.amount ?? null,
                startedAt: existingSub.startedAt,
                expiresAt: existingSub.expiresAt,
                paymentId: resolvedCheckoutId || paymentId || business.subscription?.paymentId || null,
                requestReferenceNumber:
                    requestReferenceNumber || business.subscription?.requestReferenceNumber || null
            }
            business.updatedAt = new Date()
            await business.save()
            return { dedupeKey, applied: true, reason: 'IDEMPOTENT_SUBSCRIPTION_EXISTS' }
        }
    }

    if (mappedStatus === 'SUCCESS' && effectiveSession && paymentDoc && subDoc && subDoc.status === 'PENDING_CHECKOUT') {
        const startedAt = paymentDoc?.paidAt ? new Date(paymentDoc.paidAt) : new Date()
        const expiresAt = computeSubscriptionExpiresAt(startedAt, effectiveSession.months)

        await BusinessSubscription.updateMany(
            { businessId: business._id, status: 'ACTIVE' },
            { $set: { status: 'SUPERSEDED' } }
        )

        const periodFields = BusinessSubscription.buildPeriodFields(startedAt, expiresAt)
        await BusinessSubscription.updateOne(
            { _id: subDoc._id },
            {
                $set: {
                    status: 'ACTIVE',
                    paymentId: paymentDoc._id,
                    startedAt,
                    expiresAt,
                    ...periodFields,
                    paymongoCheckoutId: resolvedCheckoutId || paymentId || ''
                }
            }
        )

        await Payment.updateOne(
            { _id: paymentDoc._id },
            { $set: { subscriptionRecordId: subDoc._id, paidAt: new Date() } }
        )

        business.billingSubscriptionId = subDoc._id
        business.billing = {
            lastAmount: effectiveSession.amount ?? null,
            lastStatus: 'PAID',
            lastPaidAt: new Date()
        }

        business.subscription = {
            ...(business.subscription || {}),
            status: 'ACTIVE',
            planId: effectiveSession.planId || null,
            months: effectiveSession.months || null,
            amount: effectiveSession.amount || null,
            startedAt,
            expiresAt,
            paymentId: resolvedCheckoutId || paymentId || null,
            requestReferenceNumber: requestReferenceNumber || null
        }
    } else if (mappedStatus === 'SUCCESS' && effectiveSession && paymentDoc && !subDoc && legacySession) {
        const startedAt = paymentDoc?.paidAt ? new Date(paymentDoc.paidAt) : new Date()
        const expiresAt = computeSubscriptionExpiresAt(startedAt, effectiveSession.months)

        await BusinessSubscription.updateMany(
            { businessId: business._id, status: 'ACTIVE' },
            { $set: { status: 'SUPERSEDED' } }
        )

        const periodFields = BusinessSubscription.buildPeriodFields(startedAt, expiresAt)
        const subRecord = await BusinessSubscription.create({
            businessId: business._id,
            userId: business.userId,
            paymentId: paymentDoc._id,
            checkoutSessionId: effectiveSession.checkoutId || resolvedCheckoutId || '',
            planId: effectiveSession.planId || '',
            months: effectiveSession.months || 0,
            amount: effectiveSession.amount || 0,
            currency: 'PHP',
            status: 'ACTIVE',
            startedAt,
            expiresAt,
            ...periodFields,
            paymongoCheckoutId: resolvedCheckoutId || paymentId || '',
            requestReferenceNumber: requestReferenceNumber || effectiveSession.requestReferenceNumber || ''
        })

        await Payment.updateOne(
            { _id: paymentDoc._id },
            { $set: { subscriptionRecordId: subRecord._id, paidAt: new Date() } }
        )

        business.billingSubscriptionId = subRecord._id
        business.billing = {
            lastAmount: effectiveSession.amount ?? null,
            lastStatus: 'PAID',
            lastPaidAt: new Date()
        }

        business.subscription = {
            ...(business.subscription || {}),
            status: 'ACTIVE',
            planId: effectiveSession.planId || null,
            months: effectiveSession.months || null,
            amount: effectiveSession.amount || null,
            startedAt,
            expiresAt,
            paymentId: resolvedCheckoutId || paymentId || null,
            requestReferenceNumber: requestReferenceNumber || null
        }
    } else if (mappedStatus === 'CANCELLED') {
        if (effectiveSession) {
            business.billing = {
                lastAmount: effectiveSession.amount ?? business.billing?.lastAmount ?? null,
                lastStatus: 'CANCELLED',
                lastPaidAt: business.billing?.lastPaidAt || null
            }
        }
        if (canTouchSubscriptionEmbed) {
            business.subscription = {
                ...(business.subscription || {}),
                status: 'CANCELLED',
                paymentId: paymentId || business.subscription?.paymentId || null,
                requestReferenceNumber:
                    requestReferenceNumber || business.subscription?.requestReferenceNumber || null
            }
        }
    } else if (mappedStatus === 'FAILED') {
        if (effectiveSession) {
            business.billing = {
                lastAmount: effectiveSession.amount ?? business.billing?.lastAmount ?? null,
                lastStatus: 'FAILED',
                lastPaidAt: business.billing?.lastPaidAt || null
            }
        }
        if (canTouchSubscriptionEmbed) {
            business.subscription = {
                ...(business.subscription || {}),
                status: 'FAILED',
                paymentId: paymentId || business.subscription?.paymentId || null,
                requestReferenceNumber:
                    requestReferenceNumber || business.subscription?.requestReferenceNumber || null
            }
        }
    }

    business.updatedAt = new Date()
    await business.save()

    return { dedupeKey, applied: true, reason: 'SYNCED' }
}

const markWebhookLedgerSyncState = async (dedupeKey, syncResult) => {
    const terminalSkip =
        syncResult.reason === 'NO_MATCHING_BUSINESS' || syncResult.reason === 'NO_MATCHING_CHECKOUT_SESSION'
    const synced = Boolean(
        syncResult.applied ||
            syncResult.reason === 'IDEMPOTENT_SUBSCRIPTION_EXISTS' ||
            syncResult.touristCheckoutSynced === true ||
            terminalSkip
    )
    await PaymongoWebhookEvent.updateOne(
        { dedupeKey },
        {
            $set: {
                businessLedgerSynced: synced,
                businessLedgerSyncedAt: synced ? new Date() : null,
                businessLedgerSyncError: syncResult.applied ? '' : String(syncResult.reason || '')
            }
        }
    )
}

export const processPaymongoWebhookEvent = async (payload = {}, headers = {}) => {
    const { dedupeKey, eventName, paymentId, requestReferenceNumber, status, eventId } = buildPaymongoDedupeKey(
        payload,
        headers
    )

    const existing = await PaymongoWebhookEvent.findOne({ dedupeKey })
    if (existing) {
        return { duplicate: true, dedupeKey }
    }

    await PaymongoWebhookEvent.create({
        dedupeKey,
        eventId,
        eventType: eventName,
        paymentId,
        requestReferenceNumber,
        status,
        payload,
        businessLedgerSynced: false
    })

    try {
        const touristResult = await tryFulfillTouristMenuOrderCheckoutFromWebhook(payload, headers)
        const syncResult = touristResult.handled
            ? touristResult
            : await syncBusinessLedgerFromPaymongoWebhookPayload(payload, headers)
        await markWebhookLedgerSyncState(dedupeKey, syncResult)
        return { duplicate: false, ...syncResult }
    } catch (err) {
        await PaymongoWebhookEvent.updateOne(
            { dedupeKey },
            {
                $set: {
                    businessLedgerSynced: false,
                    businessLedgerSyncError: String(err?.message || err)
                }
            }
        )
        throw err
    }
}

/**
 * Re-process PayMongo webhook rows that never flipped business billing (e.g. race or ID mismatch on first pass).
 */
export const reconcilePaymongoWebhooksForBusinessLedger = async ({ limit = 40 } = {}) => {
    const events = await PaymongoWebhookEvent.find({ businessLedgerSynced: { $ne: true } })
        .sort({ processedAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 40, 1), 100))
        .lean()

    let processed = 0
    let errors = 0

    for (const ev of events) {
        try {
            const syncResult = await syncBusinessLedgerFromPaymongoWebhookPayload(ev.payload || {}, {})
            await markWebhookLedgerSyncState(ev.dedupeKey, syncResult)
            if (syncResult.applied || syncResult.reason === 'IDEMPOTENT_SUBSCRIPTION_EXISTS') {
                processed += 1
            }
        } catch (_err) {
            errors += 1
        }
    }

    return { scanned: events.length, processed, errors }
}

export const getBusinessProfileByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
    const user = await User.findById(userId).select('name email avatar')

    return {
        ...extractPublicBusiness(business),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: business.verificationProofs,
        verificationNotes: business.verificationNotes,
        subscription: buildSubscriptionProfilePayload(business),
        billing: buildBillingSummaryPayload(business)
    }
}

export const getBusinessBillingLedgerByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
    const [payments, subscriptions] = await Promise.all([
        Payment.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(50).lean(),
        BusinessSubscription.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(30).lean()
    ])

    return {
        billing: buildBillingSummaryPayload(business),
        payments: payments.map(serializeLedgerPayment),
        subscriptions: subscriptions.map(serializeLedgerSubscription)
    }
}

export const createBusinessActivityLogByUserId = async (userId, payload = {}) => {
    const business = await findBusinessByUserId(userId)
    const {
        action = 'ACCOUNT_EVENT',
        category = 'ACCOUNT_SECURITY',
        severity = 'INFO',
        status = 'SUCCESS',
        description = 'Business account activity',
        details = {},
        ipAddress = '',
        userAgent = '',
        device = '',
        failureReason = ''
    } = payload

    const created = await ActivityLog.create({
        actorUserId: userId,
        actorRole: 'BUSINESS',
        scopeType: 'BUSINESS',
        scopeId: business._id,
        action,
        category,
        severity,
        status,
        description,
        details,
        ipAddress,
        userAgent,
        device,
        failureReason
    })

    return extractActivityLog(created)
}

export const getBusinessActivityLogsByUserId = async (userId, { limit = 30 } = {}) => {
    const business = await findBusinessByUserId(userId)
    const normalizedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100)
    const logs = await ActivityLog.find({ scopeType: 'BUSINESS', scopeId: business._id })
        .sort({ createdAt: -1 })
        .limit(normalizedLimit)

    return logs.map(extractActivityLog)
}

export const updateBusinessProfileByUserId = async (userId, payload) => {
    const business = await findBusinessByUserId(userId)
    const {
        ownerName,
        businessName,
        address,
        phone,
        about,
        website,
        lat,
        lng
    } = payload

    if (ownerName) {
        await User.findByIdAndUpdate(userId, { $set: { name: ownerName, updatedAt: new Date() } })
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                name: businessName,
                address,
                description: about,
                website: website || null,
                contact_info: {
                    ...(business.contact_info || {}),
                    phone
                },
                businessLocation: { lat, lng },
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).populate('category')

    const updatedUser = await User.findById(userId).select('name email avatar')

    return {
        ...extractPublicBusiness(updatedBusiness),
        ownerName: updatedUser?.name || '',
        ownerEmail: updatedUser?.email || '',
        avatar: updatedUser?.avatar || '',
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

export const updateBusinessThemeColorByUserId = async (userId, themeColor) => {
    const business = await findBusinessByUserId(userId)

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                themeColor,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).populate('category')

    const user = await User.findById(userId).select('name email avatar')

    return {
        ...extractPublicBusiness(updatedBusiness),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

export const uploadBusinessProfileImageByUserId = async (userId, profileImage) => {
    const business = await findBusinessByUserId(userId)

    const uploadResult = await cloudinary.uploader.upload(profileImage, {
        folder: 'tara-bisita/business-profile'
    })

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                logo: uploadResult.secure_url,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).populate('category')

    const user = await User.findById(userId).select('name email avatar')

    return {
        ...extractPublicBusiness(updatedBusiness),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

export const uploadBusinessAccountAvatarByUserId = async (userId, avatarImage) => {
    const business = await findBusinessByUserId(userId)

    const uploadResult = await cloudinary.uploader.upload(avatarImage, {
        folder: 'tara-bisita/business-account-avatar'
    })

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: uploadResult.secure_url,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).select('name email avatar')

    const updatedBusiness = await Business.findById(business._id).populate('category')

    return {
        ...extractPublicBusiness(updatedBusiness),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

export const uploadBusinessBannerImageByUserId = async (userId, bannerImage) => {
    const business = await findBusinessByUserId(userId)

    const uploadResult = await cloudinary.uploader.upload(bannerImage, {
        folder: 'tara-bisita/business-banner'
    })

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                banner: uploadResult.secure_url,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).populate('category')

    const user = await User.findById(userId).select('name email avatar')

    return {
        ...extractPublicBusiness(updatedBusiness),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

export const changeBusinessPasswordByUserId = async (userId, payload) => {
    const { currentPassword, newPassword } = payload
    const user = await User.findById(userId)

    if (!user) {
        throw new Error('USER_NOT_FOUND')
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
        throw new Error('INVALID_CURRENT_PASSWORD')
    }

    const samePassword = await bcrypt.compare(newPassword, user.password)
    if (samePassword) {
        throw new Error('NEW_PASSWORD_SAME_AS_CURRENT')
    }

    const genSalt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, genSalt)

    await User.findByIdAndUpdate(userId, {
        $set: {
            password: hashedPassword,
            updatedAt: new Date()
        }
    })
}

export const submitBusinessProofByUserId = async (userId, payload) => {
    const { proofs = [], proofDocuments = [], notes } = payload
    const business = await findBusinessByUserId(userId)

    const sanitizedProofs = proofs.map((proof) => proof.trim()).filter(Boolean)
    const uploadedProofUrls = []

    for (const proofDocument of proofDocuments) {
        const uploadResult = await cloudinary.uploader.upload(proofDocument, {
            folder: 'tara-bisita/business-proofs'
        })
        uploadedProofUrls.push(uploadResult.secure_url)
    }

    const allProofs = [...sanitizedProofs, ...uploadedProofUrls]
    if (!allProofs.length) {
        throw new Error('PROOF_REQUIRED')
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                verificationStatus: 'PENDING',
                verificationProofs: allProofs,
                verificationNotes: notes || null,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    ).populate('category')

    return {
        ...extractPublicBusiness(updatedBusiness),
        verificationProofs: updatedBusiness.verificationProofs,
        verificationNotes: updatedBusiness.verificationNotes
    }
}

const allowedVerificationStatuses = ['PENDING', 'VERIFIED', 'REJECTED']

const buildBusinessApprovalMessage = ({ businessName, notes }) => {
    const trimmedNotes = typeof notes === 'string' ? notes.trim() : ''

    return templateReader('business-approval-status', {
        businessName: businessName || 'your business',
        hasNotes: Boolean(trimmedNotes),
        notes: trimmedNotes
    })
}

export const incrementPublicBusinessProfileViewCount = async (businessId) => {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return null
    }

    return Business.findOneAndUpdate(
        { _id: businessId, verificationStatus: 'VERIFIED' },
        { $inc: { publicProfileViewCount: 1 }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
    ).populate('category', 'name description')
}

export const getBusinessApprovalRequests = async ({ status }) => {
    const query = {}

    if (status && allowedVerificationStatuses.includes(status)) {
        query.verificationStatus = status
    }

    const businesses = await Business.find(query)
        .populate('category', 'name')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })

    return businesses.map((business) => ({
        _id: business._id,
        name: business.name,
        address: business.address,
        logo: business.logo || '',
        verificationStatus: business.verificationStatus,
        verificationProofs: business.verificationProofs || [],
        verificationNotes: business.verificationNotes || '',
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
        category: business.category?.name || '',
        ownerName: business.userId?.name || '',
        ownerEmail: business.userId?.email || '',
        phone: business.contact_info?.phone || ''
    }))
}

/** Subscription rows that mean the business ever paid for and started a plan (partners). */
const partnerSubscriptionMatch = {
    $or: [
        { startedAt: { $type: 'date' } },
        { status: { $in: ['ACTIVE', 'EXPIRED', 'SUPERSEDED'] } }
    ]
}

export const getBusinessPartnersForAdmin = async () => {
    const [firstStartedAgg, embedPartners] = await Promise.all([
        BusinessSubscription.aggregate([
            { $match: partnerSubscriptionMatch },
            {
                $group: {
                    _id: '$businessId',
                    firstPartneredAt: { $min: '$startedAt' }
                }
            }
        ]),
        Business.find({ 'subscription.startedAt': { $type: 'date' } })
            .select('_id subscription.startedAt')
            .lean()
    ])

    const partnerIdMap = new Map()
    for (const row of firstStartedAgg) {
        const id = String(row._id)
        partnerIdMap.set(id, { objectId: row._id, firstPartneredAt: row.firstPartneredAt || null })
    }
    for (const b of embedPartners) {
        const id = String(b._id)
        const started = b.subscription?.startedAt || null
        const existing = partnerIdMap.get(id)
        if (!existing) {
            partnerIdMap.set(id, { objectId: b._id, firstPartneredAt: started })
        } else if (started) {
            const prev = existing.firstPartneredAt
            if (!prev || new Date(started) < new Date(prev)) {
                partnerIdMap.set(id, { objectId: existing.objectId, firstPartneredAt: started })
            }
        }
    }

    const allIds = [...partnerIdMap.values()].map((v) => v.objectId)
    if (!allIds.length) {
        return []
    }

    const businesses = await Business.find({ _id: { $in: allIds } })
        .populate('category', 'name')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })

    return businesses.map((business) => {
        const id = String(business._id)
        const firstPartneredAt = partnerIdMap.get(id)?.firstPartneredAt || null
        const subscription = buildSubscriptionProfilePayload(business)

        return {
            _id: business._id,
            name: business.name,
            address: business.address,
            logo: business.logo || '',
            verificationStatus: business.verificationStatus,
            createdAt: business.createdAt,
            category: business.category?.name || '',
            ownerName: business.userId?.name || '',
            ownerEmail: business.userId?.email || '',
            phone: business.contact_info?.phone || '',
            firstPartneredAt,
            subscription
        }
    })
}

export const updateBusinessVerificationStatusById = async ({ businessId, status, notes }) => {
    if (!allowedVerificationStatuses.includes(status)) {
        throw new Error('INVALID_STATUS')
    }

    const business = await Business.findById(businessId)
    if (!business) {
        throw new Error('BUSINESS_NOT_FOUND')
    }

    business.verificationStatus = status
    business.verificationNotes = notes || business.verificationNotes || null
    business.updatedAt = new Date()

    await business.save()

    const hydratedBusiness = await Business.findById(businessId)
        .populate('category', 'name')
        .populate('userId', 'name email')

    if (status === 'VERIFIED' && hydratedBusiness?.userId?.email) {
        const html = buildBusinessApprovalMessage({
            businessName: hydratedBusiness.name,
            notes
        })

        await sendMailer(
            hydratedBusiness.userId.email,
            '[TaraBisita] Business verification approved',
            html
        )
    }

    return {
        _id: hydratedBusiness._id,
        name: hydratedBusiness.name,
        verificationStatus: hydratedBusiness.verificationStatus,
        verificationNotes: hydratedBusiness.verificationNotes || '',
        ownerName: hydratedBusiness.userId?.name || '',
        ownerEmail: hydratedBusiness.userId?.email || '',
        category: hydratedBusiness.category?.name || '',
        updatedAt: hydratedBusiness.updatedAt
    }
}

export const getBusinessMenuItemsByUserId = async (userId, { includeDeleted = false } = {}) => {
    const business = await findBusinessByUserId(userId)
    const items = Array.isArray(business.menuItems) ? business.menuItems : []
    return items
        .filter((item) => includeDeleted || !item.isDeleted)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(extractMenuItem)
}

const normMenuCategory = (value) => String(value || '').trim().toLowerCase()

/** Verified businesses whose category is enabled for public menu catalog + online pickup orders (extend set as you add categories). */
const supportsPublicMenuCatalog = (business) => {
    const name = business?.category?.name
    if (typeof name !== 'string') return false
    const normalized = name.trim().toLowerCase()
    const expected = String(BUSINESS_CATEGORY_LABELS.RESTAURANT || 'Restaurant')
        .trim()
        .toLowerCase()
    return normalized === expected || normalized === 'restaurant'
}

/**
 * Public menu feed for verified businesses that support the public menu catalog. Only items that are not deleted,
 * `isAvailable` is true, and `stockStatus` is not OUT_OF_STOCK.
 * @param {{ menuCategory?: string }} options Pass `ALL` or omit to include every food type; otherwise filter by menu item `category` string (case-insensitive).
 */
export const listPublicMenuFeedItems = async ({ menuCategory = 'ALL' } = {}) => {
    const filterNorm =
        menuCategory && normMenuCategory(menuCategory) !== 'all' ? normMenuCategory(menuCategory) : null

    const businesses = await Business.find({ verificationStatus: 'VERIFIED' })
        .populate('category')
        .select('_id name logo menuItems')
        .lean()

    const eligible = []

    for (const b of businesses) {
        if (!supportsPublicMenuCatalog(b)) continue
        const menuItems = Array.isArray(b.menuItems) ? b.menuItems : []
        for (const m of menuItems) {
            if (!m || m.isDeleted) continue
            if (!m.isAvailable) continue
            if (m.stockStatus === 'OUT_OF_STOCK') continue
            eligible.push({ business: b, raw: m })
        }
    }

    const categoryLabels = new Set()
    for (const { raw } of eligible) {
        const label = String(raw.category || '').trim()
        if (label) categoryLabels.add(label)
    }

    const filtered = eligible.filter(({ raw }) => {
        if (!filterNorm) return true
        const label = String(raw.category || '').trim()
        return normMenuCategory(label) === filterNorm
    })

    const items = filtered
        .map(({ business, raw }) => ({
            ...extractMenuItem(raw),
            businessId: String(business._id),
            businessName: business.name || 'Business',
            businessLogo: business.logo || null
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const categories = Array.from(categoryLabels).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
    )

    return { items, categories }
}

/** Public menu lines for a single verified business with a supported menu catalog (available, in stock, not deleted). */
export const listPublicMenuItemsFromBusinessDoc = (business) => {
    if (!business) return []
    if (!supportsPublicMenuCatalog(business)) return []
    const menuItems = Array.isArray(business.menuItems) ? business.menuItems : []
    return menuItems
        .filter((m) => m && !m.isDeleted && m.isAvailable && m.stockStatus !== 'OUT_OF_STOCK')
        .map((m) => extractMenuItem(m))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const createBusinessMenuItemByUserId = async (userId, payload) => {
    const business = await findBusinessByUserId(userId)
    const {
        name,
        description,
        flavor,
        price,
        category = '',
        preparationTime = '',
        servingSize = '',
        spiceLevel = 'No Spice',
        allergens = '',
        isAvailable = true,
        images = []
    } = payload

    const uploadedImages = []
    for (const image of images) {
        const uploadResult = await cloudinary.uploader.upload(image, {
            folder: 'tara-bisita/business-menu'
        })
        uploadedImages.push(uploadResult.secure_url)
    }

    business.menuItems.unshift({
        name: name.trim(),
        description: description.trim(),
        flavor: flavor.trim(),
        price: Number(price),
        category: category.trim(),
        preparationTime: preparationTime.trim(),
        servingSize: servingSize.trim(),
        spiceLevel: spiceLevel.trim() || 'No Spice',
        allergens: allergens.trim(),
        isAvailable: Boolean(isAvailable),
        stockStatus: isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK',
        isDeleted: false,
        deletedAt: null,
        images: uploadedImages
    })
    business.updatedAt = new Date()
    await business.save()

    return extractMenuItem(business.menuItems[0])
}

export const deleteBusinessMenuItemByUserId = async (userId, menuItemId) => {
    const business = await findBusinessByUserId(userId)
    const item = business.menuItems.find((menuItem) => String(menuItem._id) === String(menuItemId))
    if (!item) {
        throw new Error('MENU_ITEM_NOT_FOUND')
    }
    if (item.isDeleted) {
        throw new Error('MENU_ITEM_ALREADY_DELETED')
    }

    item.isDeleted = true
    item.deletedAt = new Date()
    business.updatedAt = new Date()
    await business.save()
}

export const updateBusinessMenuItemStockByUserId = async (userId, menuItemId, stockStatus) => {
    const business = await findBusinessByUserId(userId)
    const item = business.menuItems.find((menuItem) => String(menuItem._id) === String(menuItemId))
    if (!item || item.isDeleted) {
        throw new Error('MENU_ITEM_NOT_FOUND')
    }

    item.stockStatus = stockStatus
    item.isAvailable = stockStatus === 'AVAILABLE_TO_ORDER'
    business.updatedAt = new Date()
    await business.save()

    return extractMenuItem(item)
}

export const restoreBusinessMenuItemByUserId = async (userId, menuItemId) => {
    const business = await findBusinessByUserId(userId)
    const item = business.menuItems.find((menuItem) => String(menuItem._id) === String(menuItemId))
    if (!item) {
        throw new Error('MENU_ITEM_NOT_FOUND')
    }
    if (!item.isDeleted) {
        throw new Error('MENU_ITEM_NOT_DELETED')
    }

    item.isDeleted = false
    item.deletedAt = null
    if (!item.stockStatus) {
        item.stockStatus = item.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK'
    }
    business.updatedAt = new Date()
    await business.save()

    return extractMenuItem(item)
}

export const updateBusinessMenuItemByUserId = async (userId, menuItemId, payload) => {
    const business = await findBusinessByUserId(userId)
    const item = business.menuItems.find((menuItem) => String(menuItem._id) === String(menuItemId))
    if (!item || item.isDeleted) {
        throw new Error('MENU_ITEM_NOT_FOUND')
    }

    const {
        name,
        description,
        flavor,
        price,
        category = '',
        preparationTime = '',
        servingSize = '',
        spiceLevel = 'No Spice',
        allergens = '',
        stockStatus = 'AVAILABLE_TO_ORDER',
        imageReplacements = []
    } = payload

    item.name = name.trim()
    item.description = description.trim()
    item.flavor = flavor.trim()
    item.price = Number(price)
    item.category = category.trim()
    item.preparationTime = preparationTime.trim()
    item.servingSize = servingSize.trim()
    item.spiceLevel = spiceLevel.trim() || 'No Spice'
    item.allergens = allergens.trim()
    item.stockStatus = stockStatus
    item.isAvailable = stockStatus === 'AVAILABLE_TO_ORDER'
    item.images = Array.isArray(item.images) ? item.images : []

    for (const replacement of imageReplacements) {
        const index = Number(replacement?.index)
        const image = replacement?.image
        if (!Number.isInteger(index) || index < 0 || index >= item.images.length) {
            continue
        }
        if (typeof image !== 'string' || !image.startsWith('data:image/')) {
            continue
        }
        const uploadResult = await cloudinary.uploader.upload(image, {
            folder: 'tara-bisita/business-menu'
        })
        item.images[index] = uploadResult.secure_url
    }

    business.updatedAt = new Date()
    await business.save()

    return extractMenuItem(item)
}

const formatPhp = (amount) => {
    const n = Number(amount)
    if (!Number.isFinite(n)) return 'PHP 0.00'
    return `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const relativeTimeLabel = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

const extractBusinessMessagingFromPopulatedRow = (row) => {
    const b = row.businessId
    const isObjectIdDoc =
        !b ||
        typeof b !== 'object' ||
        b instanceof mongoose.Types.ObjectId ||
        b.constructor?.name === 'ObjectId'
    if (isObjectIdDoc) {
        return {
            businessPhone: '',
            businessEmail: '',
            businessWebsite: '',
            businessWhatsapp: '',
            businessStoreImage: ''
        }
    }
    const ci = b.contact_info && typeof b.contact_info === 'object' ? b.contact_info : {}
    const social = b.socialMedia && typeof b.socialMedia === 'object' ? b.socialMedia : {}
    const wa = social.whatsapp ?? social.whatsApp ?? social.WhatsApp ?? ''
    const logo = b.logo != null ? String(b.logo).trim() : ''
    const cover = b.coverImage != null ? String(b.coverImage).trim() : ''
    const banner = b.banner != null ? String(b.banner).trim() : ''
    const businessStoreImage = logo || cover || banner || ''
    return {
        businessPhone: ci.phone != null ? String(ci.phone).trim() : '',
        businessEmail: ci.email != null ? String(ci.email).trim() : '',
        businessWebsite: b.website != null ? String(b.website).trim() : '',
        businessWhatsapp: String(wa || '').trim(),
        businessStoreImage
    }
}

const resolveCustomerOrderBusinessIdStr = (row) => {
    const bid = row.businessId
    if (bid == null) return ''
    if (typeof bid === 'object' && bid !== null && bid._id != null) return String(bid._id)
    return String(bid)
}

const mapCustomerOrderToClient = (doc) => {
    const row = doc.toObject ? doc.toObject() : doc
    const businessName =
        row.businessName ||
        (row.businessId && typeof row.businessId === 'object' && row.businessId.name != null
            ? String(row.businessId.name)
            : '')
    const messaging = extractBusinessMessagingFromPopulatedRow(row)
    const lineItems = Array.isArray(row.lineItems)
        ? row.lineItems.map((li) => ({
              menuItemId: String(li.menuItemId || ''),
              name: String(li.name || ''),
              qty: Math.min(99, Math.max(1, Number(li.qty) || 1)),
              unit: Number.isFinite(Number(li.unit)) ? Number(li.unit) : 0,
              lineNotes: String(li.lineNotes || ''),
              image: String(li.image || '')
          }))
        : []

    return {
        id: String(row._id),
        orderCode: row.orderCode,
        businessId: resolveCustomerOrderBusinessIdStr(row),
        businessName,
        ...messaging,
        customer: row.customerName,
        customerPhone: row.customerPhone || '',
        billingType: row.billingType || 'PAY_AT_PICKUP',
        notes: row.notes || '',
        productName: row.productName,
        productImage: row.productImage || '',
        productDetails: row.productDetails || '',
        lineItems,
        items: row.itemsCount,
        total: formatPhp(row.amount),
        time: relativeTimeLabel(row.createdAt),
        status: row.status,
        cancelReason: row.cancelReason || '',
        createdAt: row.createdAt
    }
}

const generateUniqueCustomerOrderCode = async (businessObjectId) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const code = `TB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const exists = await CustomerOrder.exists({ businessId: businessObjectId, orderCode: code })
        if (!exists) return code
    }
    return `TB-${Date.now()}-F${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

/**
 * Resolve live menu lines and totals for a public tourist order (throws same codes as create order).
 */
export const resolveTouristCustomerMenuOrderPayload = async ({ businessId, lines }) => {
    const business = await Business.findById(businessId).populate('category')
    if (!business || business.verificationStatus !== 'VERIFIED') {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    if (!supportsPublicMenuCatalog(business)) {
        throw new Error('MENU_CATALOG_NOT_SUPPORTED')
    }

    const menuItems = Array.isArray(business.menuItems) ? business.menuItems : []
    const resolved = []
    let totalAmount = 0
    let totalCount = 0

    for (const line of lines) {
        const mid = String(line.menuItemId)
        const qty = Math.min(99, Math.max(1, Number(line.quantity) || 1))
        const item = menuItems.find((m) => m && String(m._id) === mid && !m.isDeleted)
        if (!item) {
            throw new Error(`MENU_ITEM_NOT_FOUND:${mid}`)
        }
        if (!item.isAvailable || item.stockStatus === 'OUT_OF_STOCK') {
            throw new Error(`MENU_ITEM_UNAVAILABLE:${mid}`)
        }
        const unit = Number(item.price)
        if (!Number.isFinite(unit) || unit < 0) {
            throw new Error('INVALID_PRICE')
        }
        const lineNotes = String(line.notes ?? line.itemNotes ?? '')
            .trim()
            .slice(0, 500)
        resolved.push({
            menuItemId: mid,
            name: item.name,
            qty,
            unit,
            image: Array.isArray(item.images) && item.images.length ? item.images[0] : '',
            lineNotes
        })
        totalAmount += unit * qty
        totalCount += qty
    }

    const productName =
        resolved.length === 1
            ? `${resolved[0].name} ×${resolved[0].qty}`
            : `${resolved[0].name} (+${resolved.length - 1} more)`

    const productLines = resolved.map((r) => {
        const base = `${r.qty}× ${r.name} @ ${r.unit.toFixed(2)} = ${(r.unit * r.qty).toFixed(2)}`
        return r.lineNotes ? `${base} — Item note: ${r.lineNotes}` : base
    })

    return { business, resolved, totalAmount, totalCount, productName, productLines }
}

const buildProductDetailsBlock = ({ billingType, customerPhone, notes, productLines, totalAmount }) =>
    [
        `Billing: ${billingType}`,
        customerPhone ? `Phone: ${customerPhone}` : null,
        notes ? `Notes: ${notes}` : null,
        '—',
        ...productLines,
        `Total (PHP): ${totalAmount.toFixed(2)}`
    ]
        .filter(Boolean)
        .join('\n')

const insertTouristCustomerOrderDocument = async ({
    business,
    resolved,
    totalAmount,
    totalCount,
    productName,
    productDetails,
    customerName,
    customerPhone,
    billingType,
    notes,
    status = 'PLACED',
    placedByUserId
}) => {
    const orderCode = await generateUniqueCustomerOrderCode(business._id)
    const placed =
        placedByUserId != null && mongoose.Types.ObjectId.isValid(String(placedByUserId))
            ? { placedByUserId }
            : {}
    const lineItems = resolved.map((r) => ({
        menuItemId: String(r.menuItemId),
        name: String(r.name || ''),
        qty: Math.min(99, Math.max(1, Number(r.qty) || 1)),
        unit: Number.isFinite(Number(r.unit)) ? Number(r.unit) : 0,
        lineNotes: String(r.lineNotes || '').trim().slice(0, 500),
        image: String(r.image || '').trim()
    }))

    const order = await CustomerOrder.create({
        businessId: business._id,
        orderCode,
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone || '').trim().slice(0, 40),
        billingType,
        notes: String(notes || '').trim().slice(0, 2000),
        productName,
        productImage: resolved[0]?.image || '',
        productDetails,
        lineItems,
        itemsCount: totalCount,
        amount: Math.round(totalAmount * 100) / 100,
        currency: 'PHP',
        status,
        ...placed
    })
    return order
}

/**
 * Tourist places a menu pickup order; amounts are derived from live menu prices on the server.
 */
export const createTouristCustomerOrder = async ({
    businessId,
    customerName,
    customerPhone = '',
    billingType = 'PAY_AT_PICKUP',
    notes = '',
    lines,
    placedByUserId
}) => {
    const { business, resolved, totalAmount, totalCount, productName, productLines } =
        await resolveTouristCustomerMenuOrderPayload({ businessId, lines })
    const productDetails = buildProductDetailsBlock({
        billingType,
        customerPhone,
        notes,
        productLines,
        totalAmount
    })
    const order = await insertTouristCustomerOrderDocument({
        business,
        resolved,
        totalAmount,
        totalCount,
        productName,
        productDetails,
        customerName,
        customerPhone,
        billingType,
        notes,
        placedByUserId
    })
    return mapCustomerOrderToClient(order)
}

const buildTouristMenuOrderReferenceNumber = ({ pendingId, businessId }) => {
    const p = String(pendingId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()
    const b = String(businessId || '').replace(/[^a-fA-F0-9]/g, '').slice(-6).toUpperCase()
    return `TBTOC${b}${p}${Date.now().toString().slice(-6)}`.slice(0, 36)
}

const extractPaymongoCheckoutSessionMetadata = (payload = {}) => {
    const inner = payload?.data?.attributes?.data?.attributes
    const meta = inner?.metadata
    if (!meta || typeof meta !== 'object') {
        return {}
    }
    return meta
}

export const tryFulfillTouristMenuOrderCheckoutFromWebhook = async (payload = {}, headers = {}) => {
    const meta = extractPaymongoCheckoutSessionMetadata(payload)
    if (String(meta.tbPendingCheckoutKind || '').trim() !== 'tourist_menu_order') {
        return { handled: false, touristCheckoutSynced: false }
    }
    const pendingId = String(meta.tbPendingCheckoutId || '').trim()
    if (!pendingId || !mongoose.Types.ObjectId.isValid(pendingId)) {
        return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'INVALID_PENDING_CHECKOUT_ID' }
    }

    const eventName = resolveWebhookEventName(payload, headers)
    const payStatus = resolveWebhookStatus(payload)
    const mapped = mapWebhookToSessionStatus({ eventName, status: payStatus })

    const pending = await TouristMenuOrderCheckout.findById(pendingId)
    if (!pending) {
        return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'PENDING_CHECKOUT_NOT_FOUND' }
    }

    if (pending.status === 'PAID' && pending.customerOrderId) {
        return { handled: true, touristCheckoutSynced: true, applied: true, reason: 'IDEMPOTENT_TOURIST_CHECKOUT' }
    }

    if (mapped !== 'SUCCESS') {
        if (mapped === 'CANCELLED') {
            await TouristMenuOrderCheckout.updateOne({ _id: pendingId }, { $set: { status: 'CANCELLED' } })
        } else if (mapped === 'FAILED') {
            await TouristMenuOrderCheckout.updateOne({ _id: pendingId }, { $set: { status: 'FAILED' } })
        }
        return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'TOURIST_CHECKOUT_NOT_SUCCESS' }
    }

    const snap = pending.resolvedSnapshot || {}
    const lines = Array.isArray(snap.lines) ? snap.lines : []
    if (!lines.length || !Number.isFinite(snap.totalAmount)) {
        return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'INVALID_PENDING_SNAPSHOT' }
    }

    const business = await Business.findById(pending.businessId)
    if (!business) {
        return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'BUSINESS_MISSING_FOR_FULFILL' }
    }

    const resolved = lines.map((r) => ({
        menuItemId: r.menuItemId,
        name: r.name,
        qty: r.qty,
        unit: r.unit,
        image: r.image || '',
        lineNotes: r.lineNotes || ''
    }))
    const productLines = resolved.map((r) => {
        const base = `${r.qty}× ${r.name} @ ${r.unit.toFixed(2)} = ${(r.unit * r.qty).toFixed(2)}`
        return r.lineNotes ? `${base} — Item note: ${r.lineNotes}` : base
    })
    const productDetails = buildProductDetailsBlock({
        billingType: pending.billingType || 'PREPAID_ONLINE',
        customerPhone: pending.customerPhone,
        notes: pending.notes,
        productLines,
        totalAmount: snap.totalAmount
    })

    const order = await insertTouristCustomerOrderDocument({
        business,
        resolved,
        totalAmount: snap.totalAmount,
        totalCount: snap.itemsCount,
        productName: snap.productName || productLines[0] || 'Menu order',
        productDetails,
        customerName: pending.customerName,
        customerPhone: pending.customerPhone,
        billingType: pending.billingType || 'PREPAID_ONLINE',
        notes: pending.notes,
        placedByUserId: pending.userId
    })

    await TouristMenuOrderCheckout.updateOne(
        { _id: pendingId },
        { $set: { status: 'PAID', customerOrderId: order._id } }
    )

    try {
        await removeTouristCartItemsForBusiness(pending.userId, pending.businessId)
    } catch (err) {
        console.error('Failed to clear tourist cart after paid menu checkout', err)
    }

    return { handled: true, touristCheckoutSynced: true, applied: true, reason: 'TOURIST_ORDER_CREATED' }
}

export const getTouristMenuOrderCheckoutStatusForUser = async (userId, pendingCheckoutId) => {
    const id = String(pendingCheckoutId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('INVALID_PENDING_CHECKOUT_ID')
    }
    const doc = await TouristMenuOrderCheckout.findOne({ _id: id, userId }).lean()
    if (!doc) {
        throw new Error('PENDING_CHECKOUT_NOT_FOUND')
    }
    const businessId = String(doc.businessId)
    if (doc.status !== 'PAID' || !doc.customerOrderId) {
        return {
            status: doc.status,
            businessId,
            order: null
        }
    }
    // Safety net: ensure paid restaurant lines are removed from tourist cart
    // even if webhook-side cleanup did not run for any reason.
    try {
        await removeTouristCartItemsForBusiness(userId, businessId)
    } catch (err) {
        console.error('Failed to clear tourist cart while reading paid checkout status', err)
    }
    const order = await CustomerOrder.findById(doc.customerOrderId)
    return {
        status: 'PAID',
        businessId,
        order: order ? mapCustomerOrderToClient(order) : null
    }
}

/** Maps app billing choice to PayMongo `payment_method_types` (single method per tourist checkout). */
const mapTouristCheckoutBillingToPaymongoTypes = (billingType) => {
    const t = String(billingType || '').toUpperCase()
    if (t === 'GCASH') return ['gcash']
    if (t === 'MAYA') return ['paymaya']
    if (t === 'CARD') return ['card']
    if (t === 'GRAB_PAY') return ['grab_pay']
    return ['card', 'gcash', 'paymaya', 'grab_pay']
}

/**
 * Create PayMongo checkout for one restaurant batch; order row is created after payment (webhook).
 */
export const createTouristMenuOrderPaymongoCheckout = async ({
    userId,
    businessId,
    customerName,
    customerPhone = '',
    billingType = 'GCASH',
    notes = '',
    lines,
    returnBaseUrl
}) => {
    const { business, resolved, totalAmount, totalCount, productName, productLines } =
        await resolveTouristCustomerMenuOrderPayload({ businessId, lines })
    if (totalAmount <= 0) {
        throw new Error('INVALID_ORDER_AMOUNT')
    }

    const productDetailsPreview = buildProductDetailsBlock({
        billingType,
        customerPhone,
        notes,
        productLines,
        totalAmount
    })

    const pending = await TouristMenuOrderCheckout.create({
        businessId: business._id,
        userId,
        status: 'AWAITING_PAYMENT',
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone || '').trim().slice(0, 40),
        billingType,
        notes: String(notes || '').trim().slice(0, 2000),
        resolvedSnapshot: {
            lines: resolved.map((r) => ({
                menuItemId: r.menuItemId,
                name: r.name,
                unit: r.unit,
                qty: r.qty,
                lineNotes: r.lineNotes || '',
                image: r.image || ''
            })),
            totalAmount: Math.round(totalAmount * 100) / 100,
            itemsCount: totalCount,
            productName,
            productDetails: productDetailsPreview.slice(0, 4000)
        }
    })

    const paymongoSecretKey = getPaymongoSecretKey()
    if (!paymongoSecretKey) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('PAYMONGO_SECRET_KEY_NOT_CONFIGURED')
    }
    const checkoutEndpoint = getPaymongoCheckoutBaseUrl()
    if (!checkoutEndpoint) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('PAYMONGO_CHECKOUT_URL_NOT_CONFIGURED')
    }

    const clientBaseUrl = normalizePublicBaseUrl(returnBaseUrl || readFirstEnv(['PAYMONGO_RETURN_BASE_URL', 'CLIENT_URL']))
    if (!clientBaseUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('CHECKOUT_RETURN_BASE_URL_INVALID')
    }

    const referenceNumber = buildTouristMenuOrderReferenceNumber({ pendingId: pending._id, businessId: business._id })
    const successUrl = buildSignedTouristCheckoutReturnUrl(clientBaseUrl, {
        payment: 'success',
        pendingCheckoutId: String(pending._id)
    })
    const cancelUrl = buildSignedTouristCheckoutReturnUrl(clientBaseUrl, {
        payment: 'cancelled',
        pendingCheckoutId: String(pending._id)
    })
    if (!successUrl || !cancelUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('CHECKOUT_RETURN_URLS_INVALID')
    }

    const amountInCentavos = Math.round(Number(totalAmount) * 100)
    const fromChoice = mapTouristCheckoutBillingToPaymongoTypes(billingType)
    const enabledFromEnv = readFirstEnv(['PAYMONGO_PAYMENT_METHOD_TYPES'])
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    const paymentMethodTypes = enabledFromEnv.length
        ? fromChoice.filter((t) => enabledFromEnv.includes(t))
        : fromChoice
    if (!paymentMethodTypes.length) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT')
    }

    const lineItems =
        resolved.length === 1
            ? [
                  {
                      currency: 'PHP',
                      amount: amountInCentavos,
                      name: resolved[0].name.slice(0, 120),
                      quantity: 1,
                      description: `${resolved[0].qty}× @ PHP ${resolved[0].unit.toFixed(2)}`.slice(0, 255)
                  }
              ]
            : [
                  {
                      currency: 'PHP',
                      amount: amountInCentavos,
                      name: `Menu order (${resolved.length} items)`,
                      quantity: 1,
                      description: productName.slice(0, 255)
                  }
              ]

    const payload = {
        data: {
            attributes: {
                reference_number: referenceNumber,
                send_email_receipt: false,
                show_description: true,
                show_line_items: true,
                description: `Order — ${business.name || 'Restaurant'}`,
                line_items: lineItems,
                payment_method_types: paymentMethodTypes,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    tbPendingCheckoutKind: 'tourist_menu_order',
                    tbPendingCheckoutId: String(pending._id),
                    requestReferenceNumber: String(referenceNumber),
                    businessId: String(business._id),
                    touristUserId: String(userId)
                }
            }
        }
    }

    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${paymongoSecretKey}:`).toString('base64')}`
        },
        body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    const jsonResponse = (() => {
        try {
            return JSON.parse(responseText)
        } catch (_error) {
            return {}
        }
    })()

    const checkoutUrl = jsonResponse?.data?.attributes?.checkout_url
    const checkoutId = jsonResponse?.data?.id || ''
    if (!response.ok || !checkoutUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        const upstreamMessage =
            jsonResponse?.errors?.[0]?.detail ||
            jsonResponse?.errors?.[0]?.code ||
            responseText ||
            'Unknown PayMongo upstream error'
        throw new Error(`PayMongo checkout create failed (${response.status}): ${upstreamMessage}`)
    }

    await TouristMenuOrderCheckout.updateOne(
        { _id: pending._id },
        {
            $set: {
                checkoutSessionId: checkoutId,
                requestReferenceNumber: referenceNumber
            }
        }
    )

    return {
        checkoutUrl,
        checkoutId,
        pendingCheckoutId: String(pending._id),
        amount: Math.round(totalAmount * 100) / 100,
        businessName: business.name || ''
    }
}

export const listMyCustomerOrdersByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
    if (!supportsPublicMenuCatalog(business)) {
        throw new Error('MENU_ORDERS_NOT_AVAILABLE')
    }
    const orders = await CustomerOrder.find({ businessId: business._id }).sort({ createdAt: -1 }).lean()
    return orders.map((o) => mapCustomerOrderToClient({ ...o, _id: o._id }))
}

/** Orders the tourist placed (linked at insert time). */
export const listTouristCustomerOrdersByUserId = async (userId) => {
    const id = userId?.toString?.() ? String(userId) : String(userId || '')
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return []
    }
    const oid = new mongoose.Types.ObjectId(id)
    const orders = await CustomerOrder.find({ placedByUserId: oid })
        .populate('businessId', 'name contact_info website socialMedia logo coverImage banner')
        .sort({ createdAt: -1 })
        .lean()
    return orders.map((o) => mapCustomerOrderToClient({ ...o, _id: o._id }))
}

export const advanceMyCustomerOrderStatusByUserId = async (userId, orderId) => {
    const business = await findBusinessByUserId(userId)
    if (!supportsPublicMenuCatalog(business)) {
        throw new Error('MENU_ORDERS_NOT_AVAILABLE')
    }
    const order = await CustomerOrder.findOne({ _id: orderId, businessId: business._id })
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (order.status === 'PLACED') {
        order.status = 'PROCESSING'
    } else if (order.status === 'PROCESSING') {
        order.status = 'FINISHED'
    } else {
        throw new Error('INVALID_STATUS_TRANSITION')
    }
    await order.save()
    return mapCustomerOrderToClient(order)
}

export const cancelMyCustomerOrderByUserId = async (userId, orderId, cancelReason) => {
    const business = await findBusinessByUserId(userId)
    if (!supportsPublicMenuCatalog(business)) {
        throw new Error('MENU_ORDERS_NOT_AVAILABLE')
    }
    const order = await CustomerOrder.findOne({ _id: orderId, businessId: business._id })
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (order.status === 'FINISHED' || order.status === 'CANCELED') {
        throw new Error('ORDER_NOT_CANCELLABLE')
    }
    order.status = 'CANCELED'
    order.cancelReason = String(cancelReason || '').trim() || 'Canceled by business'
    await order.save()
    return mapCustomerOrderToClient(order)
}
