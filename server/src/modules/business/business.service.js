import Business from './Business.model.js'
import Payment, { PAYMENT_TYPES } from './Payment.model.js'
import BusinessSubscription from './BusinessSubscription.model.js'
import User from '../auth/User.model.js'
import ActivityLog from '../ActivityLog.model.js'
import PaymongoWebhookEvent from './PaymongoWebhookEvent.model.js'
import cloudinary from '../../configs/cloudinary.js'
import bcrypt from 'bcrypt'
import { sendMailer } from '../auth/auth.service.js'
import { templateReader } from '../shared/utils/templateReaderExtractor.js'
import { buildSignedBusinessBillingReturnUrl } from '../../shared/utils/routeSignature.utils.js'
import { resolveBillingPlanForCheckout } from '../subscriptionCatalog/subscriptionCatalog.service.js'

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
        expiresAt: sub.expiresAt || null
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
    const synced = Boolean(syncResult.applied || syncResult.reason === 'IDEMPOTENT_SUBSCRIPTION_EXISTS' || terminalSkip)
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
        const syncResult = await syncBusinessLedgerFromPaymongoWebhookPayload(payload, headers)
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
        { new: true }
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
        { new: true }
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
        { new: true }
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
        { new: true }
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
        { new: true }
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
        { new: true }
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
