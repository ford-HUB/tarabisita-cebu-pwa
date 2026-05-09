import mongoose from 'mongoose'
import Business from '../business/models/business.model.js'
import CustomerOrder from '../business/customer-orders/models/customer-order.model.js'
import Payment, { PAYMENT_TYPES } from '../business/billing/models/payment.model.js'
import BusinessSubscription from '../business/billing/models/business-subscription.model.js'
import User from '../auth/models/user.model.js'
import ActivityLog from '../auth/models/activity-log.model.js'
import XenditWebhookEvent from './models/xendit-webhook-event.model.js'
import BusinessPaymentMethodSetup from './models/business-payment-method-setup.model.js'
import cloudinary from '../../configs/cloudinary.js'
import bcrypt from 'bcrypt'
import { sendMailer } from '../auth/auth.service.js'
import { templateReader } from '../../shared/utils/templateReaderExtractor.js'
import {
    buildSignedBusinessBillingReturnUrl,
    buildSignedBusinessPaymentMethodsReturnUrl,
    buildSignedTouristCheckoutReturnUrl,
    buildSignedTouristExploreReturnUrl
} from '../../shared/utils/routeSignature.utils.js'
import TouristMenuOrderCheckout from '../tourist/menu-order-checkout/menu-order-checkout.model.js'
import { removeTouristCartItemsForBusiness } from '../tourist/tourist-cart-item/tourist-cart-item.service.js'
import { resolveBillingPlanForCheckout } from '../admin/manage-subscription/manage-subscription.service.js'
import { BUSINESS_CATEGORY_LABELS } from '../../shared/constants/businessCategories.js'
import { scheduleTouristOrderCompletionEmailForOrder } from '../../jobs/touristOrderCompletionEmail.job.js'
import {
    sealBookingPaymentPayload,
    openBookingPaymentPayload
} from '../../shared/utils/bookingPaymentToken.utils.js'

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
    addOns: Array.isArray(menuItem.addOns)
        ? menuItem.addOns
            .map((row) => ({
                id: String(row?.id || row?._id || '').trim(),
                name: String(row?.name || '').trim(),
                price: Number(row?.price) || 0
            }))
            .filter((row) => row.name)
        : [],
    isAvailable: Boolean(menuItem.isAvailable),
    stockStatus: menuItem.stockStatus || (menuItem.isAvailable ? 'AVAILABLE_TO_ORDER' : 'OUT_OF_STOCK'),
    isDeleted: Boolean(menuItem.isDeleted),
    deletedAt: menuItem.deletedAt || null,
    images: Array.isArray(menuItem.images) ? menuItem.images : [],
    createdAt: menuItem.createdAt
})

const normalizeAddOnList = (addOns = []) => {
    if (!Array.isArray(addOns)) return []
    return addOns
        .map((row) => {
            const name = String(row?.name || '').trim()
            const price = Number(row?.price)
            if (!name || !Number.isFinite(price) || price < 0) return null
            const id = String(row?.id || name.toLowerCase().replace(/\s+/g, '-'))
                .trim()
                .slice(0, 80)
            return {
                id,
                name,
                price: Math.round(price * 100) / 100
            }
        })
        .filter(Boolean)
}

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

const isTouristCheckoutReferenceNumber = (value) => /^TBTOC/i.test(String(value || '').trim())

const getXenditInvoiceBaseUrl = () =>
    readFirstEnv(['XENDIT_INVOICE_URL'])

const readFirstEnv = (keys = []) =>
    keys.map((key) => process.env[key]).find((value) => typeof value === 'string' && value.trim())?.trim() || ''

const normalizeSecretKey = (value) =>
    String(value || '')
        .replace(/^\uFEFF/, '')
        .trim()

const getXenditSecretKey = () =>
    normalizeSecretKey(readFirstEnv(['XENDIT_APIKEY']))

const getXenditApiBaseUrl = () =>
    readFirstEnv(['XENDIT_API_BASE_URL'])

const normalizeXenditInvoiceMethod = (value = '') => {
    const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
    if (!normalized) return ''
    if (normalized === 'MAYA' || normalized === 'PAYMAYA') return 'PAYMAYA'
    if (normalized === 'GCASH') return 'GCASH'
    if (normalized === 'CARD' || normalized === 'CARDS') return 'CREDIT_CARD'
    if (normalized === 'GRAB_PAY' || normalized === 'GRABPAY') return 'GRABPAY'
    if (normalized === 'BANK_TRANSFER') return 'BANK_TRANSFER'
    return normalized
}

const TOURIST_CHECKOUT_METHOD_CODES = ['GCASH', 'MAYA', 'GRAB_PAY', 'CARD']

const DEFAULT_BUSINESS_PAYMENT_METHODS = {
    GCASH: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    MAYA: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    GRAB_PAY: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null },
    CARD: { enabled: false, accountName: '', accountNumber: '', instructions: '', isVerified: false, verifiedAt: null }
}

const normalizeBusinessPaymentMethods = (paymentMethods = {}) => {
    const source = paymentMethods && typeof paymentMethods === 'object' ? paymentMethods : {}
    return TOURIST_CHECKOUT_METHOD_CODES.reduce((acc, code) => {
        const raw = source?.[code] || {}
        const parsedVerifiedAt = raw?.verifiedAt ? new Date(raw.verifiedAt) : null
        acc[code] = {
            enabled: raw?.enabled === true,
            accountName: String(raw?.accountName || '').trim().slice(0, 120),
            accountNumber: String(raw?.accountNumber || '').trim().slice(0, 120),
            instructions: String(raw?.instructions || '').trim().slice(0, 500),
            isVerified: Boolean(raw?.isVerified),
            verifiedAt: parsedVerifiedAt && Number.isFinite(parsedVerifiedAt.getTime()) ? parsedVerifiedAt : null
        }
        return acc
    }, {})
}

const mapTouristMethodToXenditMethod = (methodCode) => {
    if (methodCode === 'GCASH') return 'GCASH'
    if (methodCode === 'MAYA') return 'PAYMAYA'
    if (methodCode === 'GRAB_PAY') return 'GRABPAY'
    if (methodCode === 'CARD') return 'CREDIT_CARD'
    return ''
}

const getEnabledBusinessTouristPaymentMethods = (business) => {
    const normalizedSettings = normalizeBusinessPaymentMethods(business?.settings?.paymentMethods || {})
    const enabledByBusiness = TOURIST_CHECKOUT_METHOD_CODES.filter(
        (code) => normalizedSettings?.[code]?.enabled !== false && Boolean(normalizedSettings?.[code]?.isVerified)
    )
    const enabledFromEnv = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)
    if (!enabledFromEnv.length) {
        return enabledByBusiness
    }
    return enabledByBusiness.filter((code) => {
        const xenditMethod = mapTouristMethodToXenditMethod(code)
        return xenditMethod && enabledFromEnv.includes(xenditMethod)
    })
}

const ensureEnabledBusinessMethodsAreVerified = (paymentMethods = {}) => {
    for (const code of TOURIST_CHECKOUT_METHOD_CODES) {
        const row = paymentMethods?.[code] || {}
        // Tourist checkout uses Xendit invoice methods (no manual account credentials required).
        // Only require verification when the business explicitly enables the method.
        if (row.enabled === true && !row.isVerified) throw new Error('PAYMENT_METHOD_REQUIRES_VERIFICATION')
    }
}

const mapWebhookToSetupStatus = ({ eventName, status }) => {
    const mapped = mapWebhookToSessionStatus({ eventName, status })
    if (mapped === 'SUCCESS') return 'SUCCESS'
    if (mapped === 'FAILED') return 'FAILED'
    if (mapped === 'CANCELLED') return 'CANCELLED'
    return 'PENDING'
}

const buildXenditBasicAuthHeader = (secretKey) => `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`

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

const MONTHLY_ORDER_CAP_BY_PLAN_ID = {
    'starter-3-months': 10000,
    'growth-6-months': 25000,
    'pro-12-months': null
}

const resolveCurrentMonthUtcRange = () => {
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
    return { monthStart, nextMonthStart }
}

const resolveMonthlyOrderCapFromPlanId = (planId) => {
    const normalized = String(planId || '').trim().toLowerCase()
    if (!normalized) return null
    if (Object.prototype.hasOwnProperty.call(MONTHLY_ORDER_CAP_BY_PLAN_ID, normalized)) {
        return MONTHLY_ORDER_CAP_BY_PLAN_ID[normalized]
    }
    if (normalized.includes('starter')) return 10000
    if (normalized.includes('growth')) return 25000
    if (normalized.includes('pro')) return null
    return null
}

const resolveMonthlyOrderCapForBusiness = (business) => {
    const sub = business?.subscription || {}
    if (sub.status !== 'ACTIVE') {
        return null
    }
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null
    if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
        return null
    }
    return resolveMonthlyOrderCapFromPlanId(sub.planId)
}

const assertBusinessMonthlyOrderCapacity = async ({ business, incomingOrders = 1 }) => {
    const cap = resolveMonthlyOrderCapForBusiness(business)
    if (cap == null) {
        return
    }
    const increment = Math.max(1, Number(incomingOrders) || 1)
    const { monthStart, nextMonthStart } = resolveCurrentMonthUtcRange()
    const currentMonthlyOrders = await CustomerOrder.countDocuments({
        businessId: business._id,
        createdAt: { $gte: monthStart, $lt: nextMonthStart }
    })
    if (currentMonthlyOrders + increment > cap) {
        throw new Error(`MONTHLY_ORDER_CAP_REACHED:${cap}`)
    }
}

const buildCurrentMonthOrderCapacityPayload = async (business) => {
    const cap = resolveMonthlyOrderCapForBusiness(business)
    const { monthStart, nextMonthStart } = resolveCurrentMonthUtcRange()
    const used = await CustomerOrder.countDocuments({
        businessId: business._id,
        createdAt: { $gte: monthStart, $lt: nextMonthStart }
    })

    if (cap == null) {
        return {
            used,
            cap: null,
            remaining: null,
            capLabel: 'Unlimited',
            monthStart,
            nextMonthStart
        }
    }

    return {
        used,
        cap,
        remaining: Math.max(cap - used, 0),
        capLabel: String(cap),
        monthStart,
        nextMonthStart
    }
}

/** True while a prepaid period is still in effect (blocks starting another checkout for a different term). */
const isBusinessSubscriptionInActivePaidWindow = (business) => {
    const sub = business.subscription || {}
    if (sub.status !== 'ACTIVE') {
        return false
    }
    const startedAt = sub.startedAt ? new Date(sub.startedAt) : null
    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null
    if (!startedAt || Number.isNaN(startedAt.getTime())) {
        return false
    }
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return false
    }
    const now = Date.now()
    return startedAt.getTime() <= now && expiresAt.getTime() > now
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
    xenditPaymentId: p.xenditPaymentId,
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
    xenditCheckoutId: s.xenditCheckoutId,
    requestReferenceNumber: s.requestReferenceNumber,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
})

const buildPaymentLegacyIndexFields = ({ requestReferenceNumber, checkoutSessionId, paymentId } = {}) => {
    const ref = String(requestReferenceNumber || '').trim()
    const checkout = String(checkoutSessionId || '').trim()
    const externalPayment = String(paymentId || '').trim()
    return {
        orderId: ref || checkout || externalPayment,
        transactionId: checkout || externalPayment || ref
    }
}

const getSubscriptionCreatedTime = (subscription) => {
    const createdAt = subscription?.createdAt ? new Date(subscription.createdAt).getTime() : 0
    const startedAt = subscription?.startedAt ? new Date(subscription.startedAt).getTime() : 0
    return createdAt || startedAt || 0
}

const findNewerActiveSubscription = async (businessId, candidateSubscription) => {
    if (!candidateSubscription?._id) {
        return null
    }
    const active = await BusinessSubscription.findOne({
        businessId,
        status: 'ACTIVE',
        _id: { $ne: candidateSubscription._id }
    })
        .sort({ createdAt: -1 })
        .lean()
    if (!active) {
        return null
    }
    return getSubscriptionCreatedTime(active) > getSubscriptionCreatedTime(candidateSubscription) ? active : null
}

/** Pre-fills Xendit hosted checkout (esp. card billing) from business profile + owner. */
const buildCheckoutBillingPayload = (user, business) => {
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

const parseXenditJsonResponse = (responseText = '') => {
    try {
        return JSON.parse(responseText)
    } catch (_error) {
        return {}
    }
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

    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) {
        throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!xenditSecretKey.startsWith('xnd_')) {
        throw new Error('XENDIT_SECRET_KEY_INVALID')
    }

    const checkoutEndpoint = getXenditInvoiceBaseUrl()
    if (!checkoutEndpoint) {
        throw new Error('XENDIT_INVOICE_URL_NOT_CONFIGURED')
    }

    const clientBaseUrl = normalizePublicBaseUrl(
        returnBaseUrl || readFirstEnv(['CLIENT_URL'])
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

    const amountInPeso = Math.round(Number(selectedPlan.amount) * 100) / 100
    const enabledPaymentMethods = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)

    const paymentMethods = enabledPaymentMethods.length
        ? enabledPaymentMethods
        : ['GCASH', 'PAYMAYA', 'CREDIT_CARD', 'GRABPAY']

    const billing = buildCheckoutBillingPayload(user, business)

    const payload = {
        external_id: referenceNumber,
        amount: amountInPeso,
        currency: 'PHP',
        description: `${months}-month business billing subscription`,
        success_redirect_url: successUrl,
        failure_redirect_url: cancelUrl,
        customer: billing
            ? {
                  given_names: String(billing.name || '').slice(0, 60),
                  email: String(billing.email || '').trim() || undefined,
                  mobile_number: String(billing.phone || '').trim() || undefined
              }
            : undefined,
        payment_methods: paymentMethods,
        metadata: {
            businessId: String(business._id),
            planId: String(selectedPlan.id),
            months: String(months),
            amount: String(selectedPlan.amount),
            requestReferenceNumber: String(referenceNumber),
            ownerEmail: String(user?.email || '')
        }
    }

    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildXenditBasicAuthHeader(xenditSecretKey)
        },
        body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    const jsonResponse = parseXenditJsonResponse(responseText)
    const hostedCheckoutUrl = String(jsonResponse?.invoice_url || '').trim()
    const checkoutUrl = hostedCheckoutUrl
    const checkoutId = jsonResponse?.id || ''
    if (!response.ok || !checkoutUrl) {
        const upstreamMessage =
            jsonResponse?.message ||
            jsonResponse?.error_code ||
            jsonResponse?.message ||
            responseText ||
            'Unknown Xendit upstream error'
        throw new Error(`Xendit invoice create failed (${response.status}): ${upstreamMessage}`)
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
        xenditCheckoutId: '',
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
            requestReferenceNumber: checkoutData.requestReferenceNumber || '',
            ...buildPaymentLegacyIndexFields({
                requestReferenceNumber: checkoutData.requestReferenceNumber,
                checkoutSessionId: checkoutData.checkoutId
            })
        })
    } catch (_error) {
        // Avoid failing checkout if ledger row already exists
    }

    return checkoutData
}

export const registerXenditWebhook = async ({
    callbackUrl,
    events = ['checkout_session.payment.paid', 'payment.failed']
} = {}) => {
    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) {
        throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!xenditSecretKey.startsWith('xnd_')) {
        throw new Error('XENDIT_SECRET_KEY_INVALID')
    }

    const serverPublicUrl = readFirstEnv(['SERVER_PUBLIC_URL', 'WEBHOOK_BASE_URL', 'NGROK_URL'])
    const resolvedCallbackUrl = callbackUrl || (serverPublicUrl ? `${serverPublicUrl}/api/v1/business/webhooks/xendit` : '')
    if (!resolvedCallbackUrl) {
        throw new Error('XENDIT_WEBHOOK_CALLBACK_URL_NOT_CONFIGURED')
    }

    return {
        alreadyExists: false,
        provider: 'XENDIT',
        url: resolvedCallbackUrl,
        events: events.length ? events : ['invoice.paid', 'invoice.expired'],
        status: 'manual_setup_required',
        note: 'Set this URL in Xendit Dashboard callbacks and ensure XENDIT_WEBHOOK_VERIFICATION_TOKEN matches dashboard token.',
        apiBaseUrl: getXenditApiBaseUrl(),
        authConfigured: Boolean(xenditSecretKey)
    }
}

const resolveWebhookEventName = (payload = {}, headers = {}) =>
    String(
        payload?.event ||
        payload?.callback_type ||
        headers['x-callback-event'] ||
        headers['x-xendit-event'] ||
        payload?.data?.attributes?.type ||
        payload.type ||
        headers['x-xendit-event'] ||
        ''
    ).toUpperCase()

const resolveWebhookStatus = (payload = {}) => {
    const xenditStatus = String(
        payload?.status ||
            payload?.invoice_status ||
            payload?.data?.status ||
            payload?.data?.invoice_status ||
            ''
    ).toUpperCase()
    if (xenditStatus) {
        return xenditStatus
    }
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
    const m = checkoutUrl.match(/\/(cs_[a-zA-Z0-9_-]+)/i)
    if (m) {
        return m[1].split(/[#?/]/)[0]
    }

    return ''
}

/** Prefer checkout session id `cs_*` so it matches `BusinessSubscription.checkoutSessionId`. */
const resolveWebhookPaymentId = (payload = {}) => {
    const invoiceId = String(payload?.id || payload?.invoice_id || '').trim()
    if (invoiceId) {
        return invoiceId
    }
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
    const xenditMeta = payload?.metadata || {}
    if (xenditMeta && typeof xenditMeta === 'object') {
        const fromXMeta = String(
            xenditMeta.requestReferenceNumber || xenditMeta.request_reference_number || payload?.external_id || ''
        ).trim()
        if (fromXMeta) {
            return fromXMeta
        }
    }
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
    if (eventName.includes('INVOICE.PAID') || status === 'PAID' || status === 'SETTLED') {
        return 'SUCCESS'
    }
    if (eventName.includes('INVOICE.EXPIRED') || status === 'EXPIRED') {
        return 'FAILED'
    }
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

const buildXenditDedupeKey = (payload = {}, headers = {}) => {
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
export const syncBusinessLedgerFromXenditWebhookPayload = async (payload = {}, headers = {}) => {
    const { dedupeKey, eventName, status, paymentId, requestReferenceNumber } = buildXenditDedupeKey(
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
            $or: [{ xenditPaymentId: String(paymentId) }, { checkoutSessionId: String(paymentId) }]
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
            xenditPaymentId: paymentId && !String(paymentId).startsWith('cs_') ? String(paymentId) : '',
            requestReferenceNumber: requestReferenceNumber || effectiveSession.requestReferenceNumber || '',
            paidAt: paymentRowStatus === 'PAID' ? new Date() : null,
            ...buildPaymentLegacyIndexFields({
                requestReferenceNumber: requestReferenceNumber || effectiveSession.requestReferenceNumber,
                checkoutSessionId: effectiveSession.checkoutId || checkoutCsId,
                paymentId
            })
        })
    } else if (paymentDoc) {
        const paySet = {
            status: paymentRowStatus,
            xenditPaymentId:
                paymentId && !String(paymentId).startsWith('cs_')
                    ? String(paymentId)
                    : paymentDoc.xenditPaymentId
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
            const newerActive = await findNewerActiveSubscription(business._id, existingSub)
            if (newerActive) {
                return { dedupeKey, applied: true, reason: 'STALE_SUBSCRIPTION_SUPERSEDED' }
            }
            subDoc = existingSub
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

    if (
        mappedStatus === 'SUCCESS' &&
        effectiveSession &&
        paymentDoc &&
        subDoc &&
        ['PENDING_CHECKOUT', 'SUPERSEDED'].includes(subDoc.status)
    ) {
        const startedAt = paymentDoc?.paidAt ? new Date(paymentDoc.paidAt) : new Date()
        const expiresAt = computeSubscriptionExpiresAt(startedAt, effectiveSession.months)
        const newerActive = await findNewerActiveSubscription(business._id, subDoc)
        if (newerActive) {
            const periodFields = BusinessSubscription.buildPeriodFields(startedAt, expiresAt)
            await BusinessSubscription.updateOne(
                { _id: subDoc._id },
                {
                    $set: {
                        status: 'SUPERSEDED',
                        paymentId: paymentDoc._id,
                        startedAt,
                        expiresAt,
                        ...periodFields,
                        xenditCheckoutId: resolvedCheckoutId || paymentId || ''
                    }
                }
            )
            await Payment.updateOne(
                { _id: paymentDoc._id },
                { $set: { subscriptionRecordId: subDoc._id, paidAt: paymentDoc.paidAt || new Date() } }
            )
            return { dedupeKey, applied: true, reason: 'STALE_SUBSCRIPTION_SUPERSEDED' }
        }

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
                    xenditCheckoutId: resolvedCheckoutId || paymentId || ''
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
            xenditCheckoutId: resolvedCheckoutId || paymentId || '',
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
    await XenditWebhookEvent.updateOne(
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

export const processXenditWebhookEvent = async (payload = {}, headers = {}) => {
    const configuredToken = readFirstEnv(['XENDIT_WEBHOOK_VERIFICATION_TOKEN'])
    if (configuredToken) {
        const incomingToken = String(headers['x-callback-token'] || headers['x-xendit-callback-token'] || '').trim()
        if (!incomingToken || incomingToken !== configuredToken) {
            throw new Error('XENDIT_WEBHOOK_TOKEN_INVALID')
        }
    }

    const { dedupeKey, eventName, paymentId, requestReferenceNumber, status, eventId } = buildXenditDedupeKey(
        payload,
        headers
    )

    const existing = await XenditWebhookEvent.findOne({ dedupeKey })
    if (existing) {
        return { duplicate: true, dedupeKey }
    }

    await XenditWebhookEvent.create({
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
        const paymentMethodSetupResult = touristResult.handled
            ? { handled: false }
            : await tryFulfillBusinessPaymentMethodVerificationFromWebhook(payload, headers)
        const syncResult = touristResult.handled
            ? touristResult
            : paymentMethodSetupResult.handled
                ? paymentMethodSetupResult
                : await syncBusinessLedgerFromXenditWebhookPayload(payload, headers)
        await markWebhookLedgerSyncState(dedupeKey, syncResult)
        return { duplicate: false, ...syncResult }
    } catch (err) {
        await XenditWebhookEvent.updateOne(
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
export const reconcileXenditWebhooksForBusinessLedger = async ({ limit = 40 } = {}) => {
    const events = await XenditWebhookEvent.find({
        $or: [{ businessLedgerSynced: { $ne: true } }, { businessLedgerSyncError: 'PENDING_CHECKOUT_NOT_FOUND' }]
    })
        .sort({ processedAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 40, 1), 100))
        .lean()

    let processed = 0
    let errors = 0

    for (const ev of events) {
        try {
            const syncResult = await syncBusinessLedgerFromXenditWebhookPayload(ev.payload || {}, {})
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
    return buildBusinessProfilePayload({ business, userId })
}

const normalizeBusinessCategorySlug = (value) => String(value || '').trim().toLowerCase()

const resolveBusinessCategorySlug = (business) => {
    const categoryName = business?.category?.name
    const normalizedName = normalizeBusinessCategorySlug(categoryName)
    if (normalizedName === 'restaurant') return 'restaurant'
    if (normalizedName === 'resort' || normalizedName === 'hotel') return 'resort'
    return normalizedName
}

const buildBusinessProfilePayload = async ({ business, userId }) => {
    const user = await User.findById(userId).select('name email avatar')
    const monthlyCapacity = await buildCurrentMonthOrderCapacityPayload(business)
    const menuItems = Array.isArray(business.menuItems)
        ? business.menuItems.map((item) => extractMenuItem(item))
        : []

    return {
        ...extractPublicBusiness(business),
        ownerName: user?.name || '',
        ownerEmail: user?.email || '',
        avatar: user?.avatar || '',
        verificationProofs: business.verificationProofs,
        verificationNotes: business.verificationNotes,
        subscription: buildSubscriptionProfilePayload(business),
        billing: buildBillingSummaryPayload(business),
        monthlyCapacity,
        menuItems
    }
}

export const getBusinessProfileByUserIdForCategory = async (userId, categoryScope) => {
    const business = await findBusinessByUserId(userId)
    const normalizedScope = normalizeBusinessCategorySlug(categoryScope)
    const currentScope = resolveBusinessCategorySlug(business)
    if (!normalizedScope || !currentScope || normalizedScope !== currentScope) {
        throw new Error('BUSINESS_CATEGORY_MISMATCH')
    }
    return buildBusinessProfilePayload({ business, userId })
}

export const getBusinessBillingLedgerByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
    const monthlyCapacity = await buildCurrentMonthOrderCapacityPayload(business)
    const paidSubscriptionStatuses = ['ACTIVE', 'EXPIRED', 'SUPERSEDED']
    const [payments, subscriptions] = await Promise.all([
        Payment.find({ businessId: business._id, status: 'PAID' }).sort({ createdAt: -1 }).limit(50).lean(),
        BusinessSubscription.find({
            businessId: business._id,
            $or: [{ startedAt: { $type: 'date' } }, { status: { $in: paidSubscriptionStatuses } }]
        })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean()
    ])

    return {
        billing: buildBillingSummaryPayload(business),
        monthlyCapacity,
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

const DEFAULT_BUSINESS_SETTINGS = {
    receiveOrderEmailAlerts: true,
    receiveChatNotifications: true,
    autoAcceptOrders: false,
    prepTimeMinutes: 20,
    lowStockThreshold: 10,
    paymentMethods: DEFAULT_BUSINESS_PAYMENT_METHODS
}

const normalizeBusinessSettings = (settings = {}) => ({
    receiveOrderEmailAlerts: Boolean(settings.receiveOrderEmailAlerts),
    receiveChatNotifications: Boolean(settings.receiveChatNotifications),
    autoAcceptOrders: Boolean(settings.autoAcceptOrders),
    prepTimeMinutes: Number(settings.prepTimeMinutes) || DEFAULT_BUSINESS_SETTINGS.prepTimeMinutes,
    lowStockThreshold: Number(settings.lowStockThreshold) || DEFAULT_BUSINESS_SETTINGS.lowStockThreshold,
    paymentMethods: normalizeBusinessPaymentMethods(settings.paymentMethods || DEFAULT_BUSINESS_PAYMENT_METHODS)
})

export const getBusinessSettingsByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
    return normalizeBusinessSettings({
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(business.settings || {})
    })
}

export const updateBusinessSettingsByUserId = async (userId, payload) => {
    const business = await findBusinessByUserId(userId)
    const currentSettings = normalizeBusinessSettings({
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(business.settings || {})
    })
    const nextSettings = normalizeBusinessSettings(payload)

    for (const code of TOURIST_CHECKOUT_METHOD_CODES) {
        const prevRow = currentSettings?.paymentMethods?.[code] || {}
        const nextRow = nextSettings?.paymentMethods?.[code] || {}
        const detailsChanged =
            String(prevRow.accountName || '') !== String(nextRow.accountName || '') ||
            String(prevRow.accountNumber || '') !== String(nextRow.accountNumber || '')
        if (detailsChanged || nextRow.enabled === false) {
            nextRow.isVerified = false
            nextRow.verifiedAt = null
        }
    }

    ensureEnabledBusinessMethodsAreVerified(nextSettings.paymentMethods || {})

    const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                settings: nextSettings,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    )

    return normalizeBusinessSettings(updatedBusiness?.settings || nextSettings)
}

export const verifyBusinessPaymentMethodByUserId = async (userId, { methodCode, accountName, accountNumber }) => {
    const business = await findBusinessByUserId(userId)
    const code = String(methodCode || '').trim().toUpperCase()
    if (!TOURIST_CHECKOUT_METHOD_CODES.includes(code)) {
        throw new Error('PAYMENT_METHOD_NOT_SUPPORTED')
    }

    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) {
        throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!xenditSecretKey.startsWith('xnd_')) {
        throw new Error('XENDIT_SECRET_KEY_INVALID')
    }
    const checkoutEndpoint = getXenditInvoiceBaseUrl()
    if (!checkoutEndpoint) {
        throw new Error('XENDIT_INVOICE_URL_NOT_CONFIGURED')
    }
    const enabledFromEnv = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)
    const mappedMethod = mapTouristMethodToXenditMethod(code)
    if (enabledFromEnv.length && !enabledFromEnv.includes(mappedMethod)) {
        throw new Error('XENDIT_METHOD_NOT_ENABLED')
    }

    const probeId = `tb-verify-${Date.now()}-${Math.round(Math.random() * 10000)}`
    const probeUrl = `${String(checkoutEndpoint).replace(/\/+$/, '')}/${probeId}`
    const response = await fetch(probeUrl, {
        method: 'GET',
        headers: {
            Authorization: buildXenditBasicAuthHeader(xenditSecretKey)
        }
    })
    if (response.status === 401 || response.status === 403) {
        throw new Error('XENDIT_AUTH_FAILED')
    }

    const now = new Date()
    const normalized = normalizeBusinessSettings({
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(business.settings || {})
    })
    normalized.paymentMethods[code] = {
        ...normalized.paymentMethods[code],
        accountName: String(accountName || '').trim().slice(0, 120),
        accountNumber: String(accountNumber || '').trim().slice(0, 120),
        isVerified: true,
        verifiedAt: now
    }

    await Business.findByIdAndUpdate(
        business._id,
        {
            $set: {
                settings: normalized,
                updatedAt: now
            }
        },
        { returnDocument: 'after' }
    )

    return {
        methodCode: code,
        isVerified: true,
        verifiedAt: now.toISOString(),
        verificationProvider: 'XENDIT'
    }
}

export const createBusinessPaymentMethodSetupCheckoutByUserId = async (
    userId,
    { methodCode, returnBaseUrl = '' } = {}
) => {
    const business = await findBusinessByUserId(userId)
    const code = String(methodCode || '').trim().toUpperCase()
    if (!TOURIST_CHECKOUT_METHOD_CODES.includes(code)) {
        throw new Error('PAYMENT_METHOD_NOT_SUPPORTED')
    }

    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    if (!xenditSecretKey.startsWith('xnd_')) throw new Error('XENDIT_SECRET_KEY_INVALID')
    const checkoutEndpoint = getXenditInvoiceBaseUrl()
    if (!checkoutEndpoint) throw new Error('XENDIT_INVOICE_URL_NOT_CONFIGURED')

    const clientBaseUrl = normalizePublicBaseUrl(returnBaseUrl || readFirstEnv(['CLIENT_URL']))
    if (!clientBaseUrl) throw new Error('CHECKOUT_RETURN_BASE_URL_INVALID')
    const successUrl = buildSignedBusinessPaymentMethodsReturnUrl(clientBaseUrl, { payment: 'success', method: code })
    const cancelUrl = buildSignedBusinessPaymentMethodsReturnUrl(clientBaseUrl, { payment: 'cancelled', method: code })
    if (!successUrl || !cancelUrl) throw new Error('CHECKOUT_RETURN_URLS_INVALID')

    const mappedMethod = mapTouristMethodToXenditMethod(code)
    const enabledFromEnv = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)
    if (enabledFromEnv.length && !enabledFromEnv.includes(mappedMethod)) {
        throw new Error('PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT')
    }

    const externalId = `TBPMV${String(business._id).slice(-6).toUpperCase()}${Date.now().toString().slice(-8)}`
    const verificationAmount = Number(readFirstEnv(['XENDIT_PM_VERIFY_AMOUNT']) || 1)
    const payload = {
        external_id: externalId.slice(0, 36),
        amount: verificationAmount,
        currency: 'PHP',
        description: `Payment method setup verification - ${code}`,
        success_redirect_url: successUrl,
        failure_redirect_url: cancelUrl,
        payment_methods: [mappedMethod],
        metadata: {
            tbPendingCheckoutKind: 'business_payment_method_verification',
            businessId: String(business._id),
            methodCode: code
        }
    }
    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildXenditBasicAuthHeader(xenditSecretKey)
        },
        body: JSON.stringify(payload)
    })
    const responseText = await response.text()
    const jsonResponse = parseXenditJsonResponse(responseText)
    const checkoutUrl = String(jsonResponse?.invoice_url || '').trim()
    const checkoutId = String(jsonResponse?.id || '').trim()
    if (!response.ok || !checkoutUrl) {
        const upstreamMessage = jsonResponse?.message || jsonResponse?.error_code || responseText || 'Unknown Xendit upstream error'
        throw new Error(`Xendit invoice create failed (${response.status}): ${upstreamMessage}`)
    }

    // Persist mapping so we can verify from webhook even when Xendit doesn't send invoice metadata.
    try {
        await BusinessPaymentMethodSetup.create({
            businessId: business._id,
            methodCode: code,
            externalId: payload.external_id,
            checkoutId,
            status: 'PENDING'
        })
    } catch (err) {
        // If externalId already exists, keep the latest checkoutId for the mapping.
        try {
            await BusinessPaymentMethodSetup.updateOne(
                { externalId: payload.external_id },
                { $set: { businessId: business._id, methodCode: code, checkoutId } },
                { upsert: true }
            )
        } catch (e2) {
            console.error('Failed to persist payment method setup mapping', e2?.message || e2)
        }
    }

    return {
        methodCode: code,
        checkoutUrl,
        checkoutId,
        requestReferenceNumber: payload.external_id,
        verificationAmount: Number.isFinite(verificationAmount) ? verificationAmount : 1,
        currency: String(payload.currency || 'PHP')
    }
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

    const business = await Business.findOne({ _id: businessId, verificationStatus: 'VERIFIED' }).populate(
        'category',
        'name description'
    )
    if (!business || !isBusinessSubscriptionInActivePaidWindow(business)) {
        return null
    }
    business.publicProfileViewCount = Math.max(0, Number(business.publicProfileViewCount) || 0) + 1
    business.updatedAt = new Date()
    await business.save()
    return business
}

export const getBusinessApprovalRequests = async ({ status }) => {
    const query = {}

    if (status && allowedVerificationStatuses.includes(status)) {
        query.verificationStatus = status
    }

    // Approval queue should only include businesses that submitted at least one document/proof.
    query['verificationProofs.0'] = { $exists: true }

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

/** Public listing catalog support for tourist business detail pages (restaurant + stay). */
const supportsPublicListingCatalog = (business) => {
    const name = business?.category?.name
    if (typeof name !== 'string') return false
    const normalized = name.trim().toLowerCase()
    return normalized === 'restaurant' || normalized === 'resort' || normalized === 'hotel'
}

const STAY_CHECK_IN_NOTE_RE = /Check-in:\s*(\d{4}-\d{2}-\d{2})/i
const STAY_CHECK_OUT_NOTE_RE = /Check-out:\s*(\d{4}-\d{2}-\d{2})/i

const isIsoYmd = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())

const addOneCalendarDayYmd = (ymd) => {
    const [y, m, d] = String(ymd)
        .split('-')
        .map((x) => Number(x))
    const dt = new Date(y, m - 1, d)
    if (Number.isNaN(dt.getTime())) return ''
    dt.setDate(dt.getDate() + 1)
    const yy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
}

/** Nights [check-in, check-out) parsed from tourist stay booking notes. */
export const expandStayOccupiedNightsFromNotes = (notes) => {
    const text = String(notes || '')
    const checkIn = text.match(STAY_CHECK_IN_NOTE_RE)?.[1]?.trim() || ''
    const checkOut = text.match(STAY_CHECK_OUT_NOTE_RE)?.[1]?.trim() || ''
    if (!isIsoYmd(checkIn) || !isIsoYmd(checkOut) || checkOut <= checkIn) return []
    const nights = []
    let d = checkIn
    while (d < checkOut) {
        nights.push(d)
        d = addOneCalendarDayYmd(d)
        if (!d || nights.length > 400) break
    }
    return nights
}

const stayOccupancyKey = (businessId, menuItemId) => `${String(businessId)}:${String(menuItemId)}`

const accumulateStayOrderIntoOccupancyMap = (map, order) => {
    const businessId = order?.businessId != null ? String(order.businessId) : ''
    const line = Array.isArray(order?.lineItems) ? order.lineItems[0] : null
    const menuItemId = line?.menuItemId != null ? String(line.menuItemId) : ''
    if (!businessId || !menuItemId) return
    const nights = expandStayOccupiedNightsFromNotes(order.notes)
    if (!nights.length) return
    const key = stayOccupancyKey(businessId, menuItemId)
    if (!map.has(key)) map.set(key, new Set())
    const set = map.get(key)
    for (const night of nights) set.add(night)
}

export const buildStayOccupancyMapFromOrders = (orders) => {
    const map = new Map()
    for (const order of orders || []) {
        accumulateStayOrderIntoOccupancyMap(map, order)
    }
    return map
}

const fetchActiveStayBookingOrdersForBusinesses = async (businessIds) => {
    const ids = (businessIds || [])
        .map((id) => (id?.toString?.() ? id.toString() : String(id)))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (!ids.length) return []
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id))
    return CustomerOrder.find({
        businessId: { $in: objectIds },
        orderType: 'BOOKING_REQUEST',
        // Only treat confirmed rows as occupied.
        // `PLACED` = waiting for approval; `PROCESSING` = approved but pending payment.
        // Both should remain bookable until the stay is confirmed (`FINISHED`).
        status: 'FINISHED'
    })
        .select({ businessId: 1, notes: 1, lineItems: 1 })
        .lean()
}

/** Attach per-menu-item occupied night list for resort/hotel public catalog (from non-canceled booking requests). */
export const attachStayOccupancyToPublicMenuItems = async (business, menuItems) => {
    if (!business || !Array.isArray(menuItems) || !menuItems.length) return menuItems
    const cat = String(business?.category?.name || '').trim().toLowerCase()
    if (cat !== 'resort' && cat !== 'hotel') return menuItems
    const orders = await fetchActiveStayBookingOrdersForBusinesses([business._id])
    const occMap = buildStayOccupancyMapFromOrders(orders)
    const bid = String(business._id)
    return menuItems.map((item) => {
        const key = stayOccupancyKey(bid, item.id)
        const set = occMap.get(key)
        const occupiedDates = set ? [...set].sort() : []
        return { ...item, occupiedDates }
    })
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
        .select('_id name logo menuItems subscription')
        .lean()

    const eligible = []

    for (const b of businesses) {
        if (!supportsPublicMenuCatalog(b)) continue
        if (!isBusinessSubscriptionInActivePaidWindow(b)) continue
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

    const resortBusinessIds = [
        ...new Set(
            filtered
                .filter(({ business }) => {
                    const n = String(business?.category?.name || '').trim().toLowerCase()
                    return n === 'resort' || n === 'hotel'
                })
                .map(({ business }) => business._id)
        )
    ]
    const stayOrders = await fetchActiveStayBookingOrdersForBusinesses(resortBusinessIds)
    const stayOccMap = buildStayOccupancyMapFromOrders(stayOrders)

    const items = filtered
        .map(({ business, raw }) => {
            const base = {
                ...extractMenuItem(raw),
                businessId: String(business._id),
                businessName: business.name || 'Business',
                businessLogo: business.logo || null
            }
            const n = String(business?.category?.name || '').trim().toLowerCase()
            if (n !== 'resort' && n !== 'hotel') return base
            const key = stayOccupancyKey(String(business._id), String(raw._id))
            const set = stayOccMap.get(key)
            return { ...base, occupiedDates: set ? [...set].sort() : [] }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const categories = Array.from(categoryLabels).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
    )

    return { items, categories }
}

/** Public menu lines for a single verified business with a supported menu catalog (available, in stock, not deleted). */
export const listPublicMenuItemsFromBusinessDoc = (business) => {
    if (!business) return []
    if (!supportsPublicListingCatalog(business)) return []
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
        addOns = [],
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
        addOns: normalizeAddOnList(addOns),
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
        addOns = [],
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
    item.addOns = normalizeAddOnList(addOns)
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
    const orderType = String(row.orderType || 'MENU_ORDER')
    const status = String(row.status || '')
    const isBookingAwaitingPayment =
        orderType.toUpperCase() === 'BOOKING_REQUEST' && status.toUpperCase() === 'PROCESSING'
    const paymentLinkToken =
        isBookingAwaitingPayment && row.placedByUserId
            ? createTouristBookingPaymentLinkToken({
                  touristUserId: row.placedByUserId,
                  customerOrderId: row._id
              })
            : null
    const bookingPaymentLink = buildTouristBookingPaymentUrlFromToken({ paymentToken: paymentLinkToken?.token || '' })

    return {
        id: String(row._id),
        orderCode: row.orderCode,
        businessId: resolveCustomerOrderBusinessIdStr(row),
        businessName,
        ...messaging,
        customer: row.customerName,
        customerPhone: row.customerPhone || '',
        billingType: row.billingType || 'PAY_AT_PICKUP',
        orderType,
        notes: row.notes || '',
        productName: row.productName,
        productImage: row.productImage || '',
        productDetails: row.productDetails || '',
        lineItems,
        items: row.itemsCount,
        total: formatPhp(row.amount),
        time: relativeTimeLabel(row.createdAt),
        status,
        cancelReason: row.cancelReason || '',
        bookingPaymentLink,
        bookingPaymentLinkExpiresAt: paymentLinkToken?.expiresAt || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
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
    if (!isBusinessSubscriptionInActivePaidWindow(business)) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    if (!supportsPublicListingCatalog(business)) {
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

const buildTouristBookingApprovedEmailHtml = ({
    touristName,
    businessName,
    orderCode,
    orderTotal,
    payUrl
}) =>
    templateReader('tourist-booking-approved', {
        touristName: touristName || 'Tourist',
        businessName: businessName || 'Resort',
        orderCode: orderCode || '--',
        orderTotal: orderTotal || 'PHP 0.00',
        payUrl: payUrl || '',
        hasPayUrl: Boolean(payUrl)
    })

const buildTouristBookingAutoCanceledEmailHtml = ({
    touristName,
    businessName,
    packageName,
    checkInLabel
}) =>
    templateReader('tourist-booking-auto-canceled', {
        touristName: touristName || 'Tourist',
        businessName: businessName || 'Resort',
        packageName: packageName || 'Stay package',
        checkInLabel: checkInLabel || ''
    })

const BOOKING_PAYMENT_LINK_TTL_MS = 24 * 60 * 60 * 1000

const buildTouristBookingPaymentUrlFromToken = ({ paymentToken }) => {
    const clientUrl = normalizePublicBaseUrl(readFirstEnv(['CLIENT_URL', 'CLIENT_LOCAL', 'CLIENT_PRODUCTION']))
    if (!clientUrl || !paymentToken) return ''
    return `${clientUrl}/tourist/booking-payment?t=${encodeURIComponent(String(paymentToken))}`
}

const createTouristBookingPaymentLinkToken = ({ touristUserId, customerOrderId }) => {
    const exp = Date.now() + BOOKING_PAYMENT_LINK_TTL_MS
    const token = sealBookingPaymentPayload({
        v: 1,
        touristUserId: String(touristUserId || ''),
        customerOrderId: String(customerOrderId || ''),
        exp
    })
    return { token, expiresAt: new Date(exp).toISOString() }
}

const openTouristBookingPaymentLinkToken = ({ touristUserId, paymentToken }) => {
    let payload
    try {
        payload = openBookingPaymentPayload(paymentToken)
    } catch {
        throw new Error('INVALID_BOOKING_PAYMENT_TOKEN')
    }
    if (
        payload?.v !== 1 ||
        !payload?.touristUserId ||
        !payload?.customerOrderId ||
        !mongoose.Types.ObjectId.isValid(String(payload.customerOrderId)) ||
        !payload?.exp
    ) {
        throw new Error('INVALID_BOOKING_PAYMENT_TOKEN')
    }
    if (Number(payload.exp) < Date.now()) {
        throw new Error('BOOKING_PAYMENT_TOKEN_EXPIRED')
    }
    if (touristUserId != null && String(payload.touristUserId) !== String(touristUserId || '')) {
        throw new Error('BOOKING_PAYMENT_TOKEN_MISMATCH')
    }
    return {
        tokenTouristUserId: String(payload.touristUserId),
        customerOrderId: String(payload.customerOrderId),
        expiresAt: new Date(Number(payload.exp)).toISOString()
    }
}

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
    orderType = 'MENU_ORDER',
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
        orderType,
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
    orderType = 'MENU_ORDER',
    notes = '',
    lines,
    placedByUserId
}) => {
    const { business, resolved, totalAmount, totalCount, productName, productLines } =
        await resolveTouristCustomerMenuOrderPayload({ businessId, lines })
    await assertBusinessMonthlyOrderCapacity({ business, incomingOrders: 1 })
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
        orderType,
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

const pickXenditDirectEwalletCheckoutUrl = (invoiceResponse, wantedMethod) => {
    const target = String(wantedMethod || '').trim().toUpperCase()
    if (!target) return ''
    const list = Array.isArray(invoiceResponse?.available_ewallets) ? invoiceResponse.available_ewallets : []
    for (const row of list) {
        const kind = String(row?.ewallet_type || row?.channel_code || row?.type || '')
            .trim()
            .toUpperCase()
        if (kind !== target) continue
        const direct = String(row?.checkout_url || row?.checkoutUrl || row?.deeplink || '').trim()
        if (direct) return direct
    }
    return ''
}

const extractCheckoutSessionMetadata = (payload = {}) => {
    // Xendit invoice webhooks: metadata is commonly on `payload.data.metadata` (or sometimes root).
    if (payload?.data?.metadata && typeof payload.data.metadata === 'object') {
        return payload.data.metadata
    }
    if (payload?.metadata && typeof payload.metadata === 'object') {
        return payload.metadata
    }
    const xenditDataAttrs = payload?.data?.attributes
    if (xenditDataAttrs?.metadata && typeof xenditDataAttrs.metadata === 'object') {
        return xenditDataAttrs.metadata
    }
    const inner = payload?.data?.attributes?.data?.attributes
    const meta = inner?.metadata
    if (!meta || typeof meta !== 'object') {
        return {}
    }
    return meta
}

export const tryFulfillTouristMenuOrderCheckoutFromWebhook = async (payload = {}, headers = {}) => {
    const meta = extractCheckoutSessionMetadata(payload)
    const requestReferenceNumber = resolveWebhookReferenceNumber(payload)
    const checkoutSessionId = resolveWebhookPaymentId(payload)
    const pendingId = String(meta.tbPendingCheckoutId || '').trim()
    const metaKind = String(meta.tbPendingCheckoutKind || '').trim()
    const isTouristCheckoutKind = metaKind === 'tourist_menu_order' || metaKind === 'tourist_booking_request'
    let pending = null
    let usesFallbackMatch = false

    if (pendingId && mongoose.Types.ObjectId.isValid(pendingId)) {
        pending = await TouristMenuOrderCheckout.findById(pendingId)
    }

    if (!pending) {
        const byRef = String(requestReferenceNumber || payload?.external_id || '').trim()
        if (!isTouristCheckoutKind && !isTouristCheckoutReferenceNumber(byRef)) {
            return { handled: false, touristCheckoutSynced: false }
        }
        const or = []
        if (byRef) {
            or.push({ requestReferenceNumber: byRef })
        }
        if (checkoutSessionId) {
            or.push({ checkoutSessionId: checkoutSessionId })
        }
        if (!or.length) {
            return { handled: false, touristCheckoutSynced: false }
        }
        pending = await TouristMenuOrderCheckout.findOne({ $or: or }).sort({ createdAt: -1 })
        usesFallbackMatch = true
    }

    if (!pending) {
        return { handled: usesFallbackMatch, touristCheckoutSynced: true, applied: false, reason: 'PENDING_CHECKOUT_NOT_FOUND' }
    }
    if (!usesFallbackMatch && metaKind && metaKind !== 'tourist_menu_order' && metaKind !== 'tourist_booking_request') {
        return { handled: false, touristCheckoutSynced: false }
    }

    const eventName = resolveWebhookEventName(payload, headers)
    const payStatus = resolveWebhookStatus(payload)
    const mapped = mapWebhookToSessionStatus({ eventName, status: payStatus })

    if (pending.status === 'PAID' && pending.customerOrderId) {
        return { handled: true, touristCheckoutSynced: true, applied: true, reason: 'IDEMPOTENT_TOURIST_CHECKOUT' }
    }

    if (mapped !== 'SUCCESS') {
        if (mapped === 'CANCELLED') {
            await TouristMenuOrderCheckout.updateOne({ _id: pending._id }, { $set: { status: 'CANCELLED' } })
        } else if (mapped === 'FAILED') {
            await TouristMenuOrderCheckout.updateOne({ _id: pending._id }, { $set: { status: 'FAILED' } })
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
    await assertBusinessMonthlyOrderCapacity({ business, incomingOrders: 1 })

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

    let order = null
    /** Keep linkage stable: if pending already points to a booking order, always finish that order,
     *  even when webhook metadata kind is missing/inconsistent. */
    if (pending.customerOrderId) {
        order = await CustomerOrder.findById(pending.customerOrderId)
        if (!order) {
            return { handled: true, touristCheckoutSynced: true, applied: false, reason: 'ORDER_MISSING_FOR_BOOKING_PAYMENT' }
        }
        order.status = 'FINISHED'
        order.billingType = pending.billingType || order.billingType || 'PREPAID_ONLINE'
        order.orderType = order.orderType || 'BOOKING_REQUEST'
        order.notes = pending.notes || order.notes || ''
        order.updatedAt = new Date()
        await order.save()
    } else {
        order = await insertTouristCustomerOrderDocument({
            business,
            resolved,
            totalAmount: snap.totalAmount,
            totalCount: snap.itemsCount,
            productName: snap.productName || productLines[0] || 'Menu order',
            productDetails,
            customerName: pending.customerName,
            customerPhone: pending.customerPhone,
            billingType: pending.billingType || 'PREPAID_ONLINE',
            orderType: pending.customerOrderId ? 'BOOKING_REQUEST' : 'MENU_ORDER',
            notes: pending.notes,
            placedByUserId: pending.userId
        })
    }

    await TouristMenuOrderCheckout.updateOne(
        { _id: pending._id },
        { $set: { status: 'PAID', customerOrderId: order._id } }
    )

    try {
        await removeTouristCartItemsForBusiness(pending.userId, pending.businessId)
    } catch (err) {
        console.error('Failed to clear tourist cart after paid menu checkout', err)
    }

    return { handled: true, touristCheckoutSynced: true, applied: true, reason: 'TOURIST_ORDER_PAID' }
}

const tryFulfillBusinessPaymentMethodVerificationFromWebhook = async (payload = {}, headers = {}) => {
    const meta = extractCheckoutSessionMetadata(payload)
    const kind = String(meta.tbPendingCheckoutKind || '').trim()
    const eventName = resolveWebhookEventName(payload, headers)
    const payStatus = resolveWebhookStatus(payload)
    const mapped = mapWebhookToSetupStatus({ eventName, status: payStatus })
    if (mapped !== 'SUCCESS') {
        // Not our concern unless it was intended for setup verification.
        if (kind !== 'business_payment_method_verification') {
            return { handled: false, businessPaymentMethodSetupSynced: false }
        }
        return { handled: true, businessPaymentMethodSetupSynced: true, applied: false, reason: 'SETUP_NOT_SUCCESS' }
    }

    // Preferred path: webhook includes our metadata.
    let businessId = String(meta.businessId || '').trim()
    let methodCode = String(meta.methodCode || '').trim().toUpperCase()

    // Fallback: some Xendit webhook payloads omit metadata entirely.
    if (kind !== 'business_payment_method_verification' || !mongoose.Types.ObjectId.isValid(businessId)) {
        const reference = String(payload?.external_id || resolveWebhookReferenceNumber(payload) || '').trim()
        const paymentId = String(payload?.id || resolveWebhookPaymentId(payload) || '').trim()
        if (!reference.startsWith('TBPMV') && !paymentId) {
            return { handled: false, businessPaymentMethodSetupSynced: false }
        }
        const setup = await BusinessPaymentMethodSetup.findOne({
            $or: [
                ...(reference ? [{ externalId: reference }] : []),
                ...(paymentId ? [{ checkoutId: paymentId }] : [])
            ]
        }).sort({ createdAt: -1 })
        if (!setup) {
            return { handled: true, businessPaymentMethodSetupSynced: true, applied: false, reason: 'SETUP_SESSION_NOT_FOUND' }
        }
        businessId = String(setup.businessId || '').trim()
        methodCode = String(setup.methodCode || '').trim().toUpperCase()
    }

    if (!mongoose.Types.ObjectId.isValid(businessId) || !TOURIST_CHECKOUT_METHOD_CODES.includes(methodCode)) {
        return { handled: true, businessPaymentMethodSetupSynced: true, applied: false, reason: 'INVALID_SETUP_METADATA' }
    }

    const business = await Business.findById(businessId)
    if (!business) {
        return { handled: true, businessPaymentMethodSetupSynced: true, applied: false, reason: 'BUSINESS_NOT_FOUND_FOR_SETUP' }
    }
    const settings = normalizeBusinessSettings({
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(business.settings || {})
    })
    const now = new Date()
    settings.paymentMethods[methodCode] = {
        ...settings.paymentMethods[methodCode],
        isVerified: true,
        verifiedAt: now
    }
    await Business.updateOne(
        { _id: business._id },
        {
            $set: {
                settings,
                updatedAt: now
            }
        }
    )

    // Best-effort: mark setup row as applied.
    try {
        const reference = String(payload?.external_id || resolveWebhookReferenceNumber(payload) || '').trim()
        const paymentId = String(payload?.id || resolveWebhookPaymentId(payload) || '').trim()
        const query = reference ? { externalId: reference } : paymentId ? { checkoutId: paymentId } : null
        if (query) {
            await BusinessPaymentMethodSetup.updateOne(query, {
                $set: {
                    status: 'PAID',
                    verifiedAppliedAt: now
                }
            })
        }
    } catch {
        // ignore
    }
    return { handled: true, businessPaymentMethodSetupSynced: true, applied: true, reason: 'BUSINESS_PAYMENT_METHOD_VERIFIED' }
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
const mapTouristCheckoutBillingToXenditMethods = (billingType) => {
    const t = String(billingType || '').toUpperCase()
    if (t === 'GCASH') return ['GCASH']
    if (t === 'MAYA') return ['PAYMAYA']
    if (t === 'CARD') return ['CREDIT_CARD']
    if (t === 'GRAB_PAY') return ['GRABPAY']
    return ['CREDIT_CARD', 'GCASH', 'PAYMAYA', 'GRABPAY']
}

/**
 * Create PayMongo checkout for one restaurant batch; order row is created after payment (webhook).
 */
export const createTouristMenuOrderXenditCheckout = async ({
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
    const enabledBusinessPaymentMethods = getEnabledBusinessTouristPaymentMethods(business)
    if (!enabledBusinessPaymentMethods.length) {
        throw new Error('PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS')
    }
    if (!enabledBusinessPaymentMethods.includes(String(billingType || '').toUpperCase())) {
        throw new Error('PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS')
    }
    await assertBusinessMonthlyOrderCapacity({ business, incomingOrders: 1 })
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

    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!xenditSecretKey.startsWith('xnd_')) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_SECRET_KEY_INVALID')
    }
    const checkoutEndpoint = getXenditInvoiceBaseUrl()
    if (!checkoutEndpoint) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_INVOICE_URL_NOT_CONFIGURED')
    }

    const clientBaseUrl = normalizePublicBaseUrl(
        returnBaseUrl || readFirstEnv(['CLIENT_URL'])
    )
    if (!clientBaseUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('CHECKOUT_RETURN_BASE_URL_INVALID')
    }

    const referenceNumber = buildTouristMenuOrderReferenceNumber({ pendingId: pending._id, businessId: business._id })
    const successUrl = buildSignedTouristExploreReturnUrl(clientBaseUrl, { payment: 'success' })
    const cancelUrl = buildSignedTouristExploreReturnUrl(clientBaseUrl, { payment: 'cancelled' })
    if (!successUrl || !cancelUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('CHECKOUT_RETURN_URLS_INVALID')
    }

    const amountInPeso = Math.round(Number(totalAmount) * 100) / 100
    const fromChoice = mapTouristCheckoutBillingToXenditMethods(billingType)
    const enabledFromEnv = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)
    const paymentMethodTypes = enabledFromEnv.length
        ? fromChoice.filter((t) => enabledFromEnv.includes(t))
        : fromChoice
    if (!paymentMethodTypes.length) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT')
    }

    const payload = {
        external_id: referenceNumber,
        amount: amountInPeso,
        currency: 'PHP',
        description: `Order - ${business.name || 'Restaurant'}`,
        success_redirect_url: successUrl,
        failure_redirect_url: cancelUrl,
        payment_methods: paymentMethodTypes,
        metadata: {
            tbPendingCheckoutKind: 'tourist_menu_order',
            tbPendingCheckoutId: String(pending._id),
            requestReferenceNumber: String(referenceNumber),
            businessId: String(business._id),
            touristUserId: String(userId),
            productName: productName.slice(0, 255)
        }
    }

    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildXenditBasicAuthHeader(xenditSecretKey)
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

    const hostedCheckoutUrl = String(jsonResponse?.invoice_url || '').trim()
    const wantsGcash = paymentMethodTypes.includes('GCASH')
    const directGcashUrl = wantsGcash ? pickXenditDirectEwalletCheckoutUrl(jsonResponse, 'GCASH') : ''
    const checkoutUrl = directGcashUrl || hostedCheckoutUrl
    const checkoutId = jsonResponse?.id || ''
    if (!response.ok || !checkoutUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        const upstreamMessage =
            jsonResponse?.message ||
            jsonResponse?.error_code ||
            responseText ||
            'Unknown Xendit upstream error'
        throw new Error(`Xendit invoice create failed (${response.status}): ${upstreamMessage}`)
    }

    if (wantsGcash) {
        console.info('[TouristMenuOrderCheckout] gcash redirect resolution', {
            pendingCheckoutId: String(pending._id),
            checkoutId: String(checkoutId || ''),
            usedDirectGcash: Boolean(directGcashUrl),
            hasAvailableEwallets: Array.isArray(jsonResponse?.available_ewallets),
            availableEwalletTypes: Array.isArray(jsonResponse?.available_ewallets)
                ? jsonResponse.available_ewallets
                    .map((row) => String(row?.ewallet_type || row?.channel_code || row?.type || '').trim())
                    .filter(Boolean)
                : []
        })
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

export const createTouristBookingRequestPaymentCheckout = async ({
    userId,
    customerOrderId,
    returnBaseUrl,
    paymentMethod = 'GCASH'
}) => {
    const oid = String(customerOrderId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(oid)) {
        throw new Error('ORDER_NOT_FOUND')
    }
    const order = await CustomerOrder.findById(oid)
    if (!order || String(order.placedByUserId || '') !== String(userId || '')) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (String(order.orderType || '').toUpperCase() !== 'BOOKING_REQUEST') {
        throw new Error('BOOKING_PAYMENT_NOT_ALLOWED')
    }
    const paidCheckoutExists = await TouristMenuOrderCheckout.exists({
        customerOrderId: order._id,
        status: 'PAID'
    })
    if (paidCheckoutExists) {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    const orderStatus = String(order.status || '').toUpperCase()
    if (orderStatus === 'FINISHED') {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    if (orderStatus !== 'PROCESSING') {
        throw new Error('BOOKING_NOT_APPROVED')
    }

    const business = await Business.findById(order.businessId).populate('category')
    if (!business || business.verificationStatus !== 'VERIFIED' || !supportsPublicListingCatalog(business)) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    if (!isBusinessSubscriptionInActivePaidWindow(business)) {
        throw new Error('BUSINESS_NOT_FOUND')
    }
    const enabledBusinessPaymentMethods = getEnabledBusinessTouristPaymentMethods(business)
    if (!enabledBusinessPaymentMethods.length) {
        throw new Error('PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS')
    }
    if (!enabledBusinessPaymentMethods.includes(String(paymentMethod || '').toUpperCase())) {
        throw new Error('PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS')
    }

    const lineItems = Array.isArray(order.lineItems) ? order.lineItems : []
    const resolved = lineItems.map((r) => ({
        menuItemId: String(r.menuItemId || ''),
        name: String(r.name || ''),
        qty: Math.min(99, Math.max(1, Number(r.qty) || 1)),
        unit: Number.isFinite(Number(r.unit)) ? Number(r.unit) : 0,
        image: String(r.image || ''),
        lineNotes: String(r.lineNotes || '')
    }))
    const totalAmount = Number(order.amount || 0)
    const totalCount = Number(order.itemsCount || resolved.reduce((n, r) => n + r.qty, 0))
    if (!resolved.length || totalAmount <= 0) {
        throw new Error('INVALID_ORDER_AMOUNT')
    }

    const productLines = resolved.map((r) => {
        const base = `${r.qty}× ${r.name} @ ${r.unit.toFixed(2)} = ${(r.unit * r.qty).toFixed(2)}`
        return r.lineNotes ? `${base} — Item note: ${r.lineNotes}` : base
    })
    const productDetailsPreview = buildProductDetailsBlock({
        billingType: 'PREPAID_ONLINE',
        customerPhone: order.customerPhone || '',
        notes: order.notes || '',
        productLines,
        totalAmount
    })

    const pending = await TouristMenuOrderCheckout.create({
        businessId: business._id,
        userId,
        status: 'AWAITING_PAYMENT',
        customerName: String(order.customerName || '').trim(),
        customerPhone: String(order.customerPhone || '').trim().slice(0, 40),
        billingType: 'PREPAID_ONLINE',
        notes: String(order.notes || '').trim().slice(0, 2000),
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
            productName: String(order.productName || '').slice(0, 255),
            productDetails: productDetailsPreview.slice(0, 4000)
        },
        customerOrderId: order._id
    })

    const xenditSecretKey = getXenditSecretKey()
    if (!xenditSecretKey) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_SECRET_KEY_NOT_CONFIGURED')
    }
    if (!xenditSecretKey.startsWith('xnd_')) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_SECRET_KEY_INVALID')
    }
    const checkoutEndpoint = getXenditInvoiceBaseUrl()
    if (!checkoutEndpoint) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('XENDIT_INVOICE_URL_NOT_CONFIGURED')
    }
    const clientBaseUrl = normalizePublicBaseUrl(returnBaseUrl || readFirstEnv(['CLIENT_URL']))
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

    const fromChoice = mapTouristCheckoutBillingToXenditMethods(paymentMethod)
    const enabledFromEnv = readFirstEnv(['XENDIT_PAYMENT_METHODS'])
        .split(',')
        .map((value) => normalizeXenditInvoiceMethod(value))
        .filter(Boolean)
    const paymentMethodTypes = enabledFromEnv.length
        ? fromChoice.filter((t) => enabledFromEnv.includes(t))
        : fromChoice
    if (!paymentMethodTypes.length) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        throw new Error('PAYMENT_METHOD_NOT_ENABLED_FOR_CHECKOUT')
    }

    const payload = {
        external_id: referenceNumber,
        amount: Math.round(Number(totalAmount) * 100) / 100,
        currency: 'PHP',
        description: `Booking payment - ${business.name || 'Resort'}`,
        success_redirect_url: successUrl,
        failure_redirect_url: cancelUrl,
        payment_methods: paymentMethodTypes,
        metadata: {
            tbPendingCheckoutKind: 'tourist_booking_request',
            tbPendingCheckoutId: String(pending._id),
            requestReferenceNumber: String(referenceNumber),
            businessId: String(business._id),
            touristUserId: String(userId),
            customerOrderId: String(order._id),
            productName: String(order.productName || '').slice(0, 255)
        }
    }

    const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildXenditBasicAuthHeader(xenditSecretKey)
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
    const checkoutUrl = jsonResponse?.invoice_url
    const checkoutId = jsonResponse?.id || ''
    if (!response.ok || !checkoutUrl) {
        await TouristMenuOrderCheckout.deleteOne({ _id: pending._id })
        const upstreamMessage = jsonResponse?.message || jsonResponse?.error_code || responseText || 'Unknown Xendit upstream error'
        throw new Error(`Xendit invoice create failed (${response.status}): ${upstreamMessage}`)
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
        businessName: business.name || '',
        customerOrderId: String(order._id)
    }
}

export const resolveTouristBookingPaymentLinkByToken = async ({ userId, paymentToken }) => {
    const { tokenTouristUserId, customerOrderId, expiresAt } = openTouristBookingPaymentLinkToken({
        touristUserId: userId,
        paymentToken
    })
    const order = await CustomerOrder.findById(customerOrderId).populate('businessId', 'name settings.paymentMethods')
    if (!order || String(order.placedByUserId || '') !== String(tokenTouristUserId || '')) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (String(order.orderType || '').toUpperCase() !== 'BOOKING_REQUEST') {
        throw new Error('BOOKING_PAYMENT_NOT_ALLOWED')
    }
    const paidCheckoutExists = await TouristMenuOrderCheckout.exists({
        customerOrderId: order._id,
        status: 'PAID'
    })
    if (paidCheckoutExists) {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    if (String(order.status || '').toUpperCase() === 'FINISHED') {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    const businessName =
        order.businessId && typeof order.businessId === 'object'
            ? String(order.businessId.name || '').trim()
            : ''
    const enabledPaymentMethods =
        order.businessId && typeof order.businessId === 'object'
            ? getEnabledBusinessTouristPaymentMethods(order.businessId)
            : TOURIST_CHECKOUT_METHOD_CODES
    return {
        orderId: String(order._id),
        orderCode: String(order.orderCode || ''),
        orderStatus: String(order.status || ''),
        amount: Math.round((Number(order.amount) || 0) * 100) / 100,
        currency: String(order.currency || 'PHP'),
        productName: String(order.productName || 'Booking request'),
        businessName,
        availablePaymentMethods: enabledPaymentMethods,
        expiresAt
    }
}

export const createTouristBookingRequestPaymentCheckoutByToken = async ({
    userId,
    paymentToken,
    returnBaseUrl,
    paymentMethod = 'GCASH'
}) => {
    const { tokenTouristUserId, customerOrderId } = openTouristBookingPaymentLinkToken({
        touristUserId: userId,
        paymentToken
    })
    return createTouristBookingRequestPaymentCheckout({
        userId: userId || tokenTouristUserId,
        customerOrderId,
        returnBaseUrl,
        paymentMethod
    })
}

export const resolveTouristBookingPaymentLinkByPublicToken = async ({ paymentToken }) => {
    const { tokenTouristUserId, customerOrderId, expiresAt } = openTouristBookingPaymentLinkToken({
        paymentToken
    })
    const order = await CustomerOrder.findById(customerOrderId).populate('businessId', 'name settings.paymentMethods')
    if (!order || String(order.placedByUserId || '') !== String(tokenTouristUserId || '')) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (String(order.orderType || '').toUpperCase() !== 'BOOKING_REQUEST') {
        throw new Error('BOOKING_PAYMENT_NOT_ALLOWED')
    }
    const paidCheckoutExists = await TouristMenuOrderCheckout.exists({
        customerOrderId: order._id,
        status: 'PAID'
    })
    if (paidCheckoutExists) {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    if (String(order.status || '').toUpperCase() === 'FINISHED') {
        throw new Error('BOOKING_ALREADY_PAID')
    }
    const businessName =
        order.businessId && typeof order.businessId === 'object'
            ? String(order.businessId.name || '').trim()
            : ''
    const enabledPaymentMethods =
        order.businessId && typeof order.businessId === 'object'
            ? getEnabledBusinessTouristPaymentMethods(order.businessId)
            : TOURIST_CHECKOUT_METHOD_CODES
    return {
        orderId: String(order._id),
        orderCode: String(order.orderCode || ''),
        orderStatus: String(order.status || ''),
        amount: Math.round((Number(order.amount) || 0) * 100) / 100,
        currency: String(order.currency || 'PHP'),
        productName: String(order.productName || 'Booking request'),
        businessName,
        availablePaymentMethods: enabledPaymentMethods,
        expiresAt
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

export const listMyResortBookingRecordsByUserId = async (userId) => {
    const business = await findBusinessByUserId(userId)
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

const extractEmailFromText = (text) => {
    const raw = String(text || '')
    const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    return match?.[0] ? String(match[0]).trim() : ''
}

const STAY_CHECK_IN_LABEL_RE = /Check-in:\s*([^\n]+)/i

const extractStayCheckInLabelFromNotes = (notes) => {
    const text = String(notes || '')
    const match = text.match(STAY_CHECK_IN_LABEL_RE)?.[1]
    return match ? String(match).trim() : ''
}

const resolveBookingPackageName = (order) => {
    const line = Array.isArray(order?.lineItems) ? order.lineItems[0] : null
    const fromLine = String(line?.name || '').trim()
    if (fromLine) return fromLine
    const fromProductName = String(order?.productName || '').trim()
    if (fromProductName) return fromProductName
    return 'Stay package'
}

const cancelConflictingPendingStayBookingRequests = async ({ approvedOrder, business }) => {
    const order = approvedOrder
    if (!order || !business) return { canceledCount: 0 }
    const normalizedBusinessCategory = String(business?.category?.name || '')
        .trim()
        .toUpperCase()
    const isStayBusiness = normalizedBusinessCategory === 'RESORT' || normalizedBusinessCategory === 'HOTEL'
    if (!isStayBusiness) return { canceledCount: 0 }
    if (String(order?.orderType || '').toUpperCase() !== 'BOOKING_REQUEST') return { canceledCount: 0 }
    if (String(order?.status || '').toUpperCase() !== 'PROCESSING') return { canceledCount: 0 }

    const approvedLine = Array.isArray(order?.lineItems) ? order.lineItems[0] : null
    const approvedMenuItemId = String(approvedLine?.menuItemId || '').trim()
    if (!approvedMenuItemId) return { canceledCount: 0 }

    const approvedNights = expandStayOccupiedNightsFromNotes(order.notes)
    if (!approvedNights.length) return { canceledCount: 0 }
    const approvedNightSet = new Set(approvedNights)

    const candidates = await CustomerOrder.find({
        businessId: business._id,
        orderType: 'BOOKING_REQUEST',
        status: 'PLACED',
        _id: { $ne: order._id },
        'lineItems.0.menuItemId': approvedMenuItemId
    })
        .select({ _id: 1, placedByUserId: 1, notes: 1, productName: 1, productDetails: 1, lineItems: 1, orderCode: 1 })
        .lean()

    if (!candidates.length) return { canceledCount: 0 }

    const cancellable = []
    for (const row of candidates) {
        const nights = expandStayOccupiedNightsFromNotes(row.notes)
        if (!nights.length) continue
        if (nights.some((d) => approvedNightSet.has(d))) {
            cancellable.push(row)
        }
    }
    if (!cancellable.length) return { canceledCount: 0 }

    let canceledCount = 0
    const cancelReason = 'Auto-canceled: requested stay schedule is already occupied by another booking.'
    const packageName = resolveBookingPackageName(order)

    for (const row of cancellable) {
        const updated = await CustomerOrder.updateOne(
            { _id: row._id, status: 'PLACED' },
            { $set: { status: 'CANCELED', cancelReason } }
        )
        if ((updated?.modifiedCount || 0) < 1) continue
        canceledCount += 1

        try {
            const tourist = row.placedByUserId ? await User.findById(row.placedByUserId).select('name email') : null
            const fallbackEmail = extractEmailFromText(row.notes) || extractEmailFromText(row.productDetails)
            const recipientEmail = String(tourist?.email || fallbackEmail || '').trim()
            if (!recipientEmail) continue
            const checkInLabel = extractStayCheckInLabelFromNotes(row.notes)
            const html = buildTouristBookingAutoCanceledEmailHtml({
                touristName: tourist?.name || '',
                businessName: business?.name || 'Resort',
                packageName,
                checkInLabel
            })
            await sendMailer(recipientEmail, '[TaraBisita] Booking request cancelled - schedule occupied', html)
        } catch (err) {
            console.warn('[BookingAutoCancelEmail] failed', {
                orderId: String(row?._id || ''),
                orderCode: String(row?.orderCode || ''),
                message: err?.message || String(err || '')
            })
        }
    }

    return { canceledCount }
}

export const advanceMyCustomerOrderStatusByUserId = async (userId, orderId, options = {}) => {
    const forceBookingApprovalEmail = Boolean(options?.forceBookingApprovalEmail)
    const business = await findBusinessByUserId(userId)
    if (!supportsPublicListingCatalog(business)) {
        throw new Error('MENU_ORDERS_NOT_AVAILABLE')
    }
    const order = await CustomerOrder.findOne({ _id: orderId, businessId: business._id })
    if (!order) {
        throw new Error('ORDER_NOT_FOUND')
    }
    if (order.status === 'PLACED') {
        order.status = 'PROCESSING'
    } else if (order.status === 'PROCESSING') {
    if (String(order.orderType || '').toUpperCase() === 'BOOKING_REQUEST') {
            throw new Error('INVALID_STATUS_TRANSITION')
        }
        order.status = 'FINISHED'
    } else {
        throw new Error('INVALID_STATUS_TRANSITION')
    }
    await order.save()
    const normalizedBusinessCategory = String(business?.category?.name || '')
        .trim()
        .toUpperCase()
    const isStayBusiness = normalizedBusinessCategory === 'RESORT' || normalizedBusinessCategory === 'HOTEL'
    const isBookingRequestOrder =
        forceBookingApprovalEmail ||
        String(order.orderType || '').toUpperCase() === 'BOOKING_REQUEST' ||
        (isStayBusiness && order.status === 'PROCESSING')

    if (order.status === 'PROCESSING' && isBookingRequestOrder) {
        await cancelConflictingPendingStayBookingRequests({ approvedOrder: order, business }).catch((err) =>
            console.warn('[BookingAutoCancel] failed', { orderId: String(order?._id || ''), message: err?.message || String(err || '') })
        )
    }

    if (order.status === 'PROCESSING' && isBookingRequestOrder) {
        const tourist = order.placedByUserId ? await User.findById(order.placedByUserId).select('name email') : null
        const fallbackEmail = extractEmailFromText(order.notes) || extractEmailFromText(order.productDetails)
        const recipientEmail = String(tourist?.email || fallbackEmail || '').trim()
        const clientUrl = normalizePublicBaseUrl(readFirstEnv(['CLIENT_URL', 'CLIENT_LOCAL', 'CLIENT_PRODUCTION']))
        const bookingPayToken = tourist?._id
            ? createTouristBookingPaymentLinkToken({
                touristUserId: tourist._id,
                customerOrderId: order._id
            })
            : null
        const payUrl =
            clientUrl && bookingPayToken?.token
                ? `${clientUrl}/tourist/booking-payment?t=${encodeURIComponent(String(bookingPayToken.token))}`
                : ''
        if (recipientEmail) {
            const html = buildTouristBookingApprovedEmailHtml({
                touristName: tourist?.name || '',
                businessName: business?.name || 'Resort',
                orderCode: order.orderCode,
                orderTotal: formatPhp(order.amount),
                payUrl
            })
            await sendMailer(recipientEmail, '[TaraBisita] Booking approved - complete payment', html)
            console.info('[BookingApprovalEmail] sent', {
                orderId: String(order._id),
                orderCode: order.orderCode,
                touristEmail: recipientEmail,
                recipientSource: tourist?.email ? 'tourist-account' : 'booking-notes-fallback',
                hasPayUrl: Boolean(payUrl),
                paymentLinkExpiresAt: bookingPayToken?.expiresAt || null
            })
        } else {
            console.warn('[BookingApprovalEmail] skipped: no recipient email', {
                orderId: String(order._id),
                orderCode: order.orderCode,
                hasPlacedByUserId: Boolean(order.placedByUserId),
                hasNotesEmailCandidate: Boolean(fallbackEmail)
            })
        }
    }
    if (order.status === 'FINISHED') {
        scheduleTouristOrderCompletionEmailForOrder(order._id).catch((err) =>
            console.error('Failed to schedule tourist order completion email', err?.message || err)
        )
    }
    return mapCustomerOrderToClient(order)
}

/** Dedicated resort/hotel booking approval path (separate from generic customer-order advance). */
export const advanceMyResortBookingRecordStatusByUserId = async (userId, orderId) =>
    advanceMyCustomerOrderStatusByUserId(userId, orderId, { forceBookingApprovalEmail: true })

export const cancelMyCustomerOrderByUserId = async (userId, orderId, cancelReason) => {
    const business = await findBusinessByUserId(userId)
    if (!supportsPublicListingCatalog(business)) {
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

export const autoCancelExpiredBookingPaymentOrders = async ({ now = new Date() } = {}) => {
    const nowDate = now instanceof Date ? now : new Date(now)
    if (Number.isNaN(nowDate.getTime())) {
        return { checkedCount: 0, canceledCount: 0 }
    }

    const threshold = new Date(nowDate.getTime() - BOOKING_PAYMENT_LINK_TTL_MS)
    const pendingRows = await CustomerOrder.find(
        {
            orderType: 'BOOKING_REQUEST',
            status: 'PROCESSING',
            updatedAt: { $lte: threshold }
        },
        { _id: 1 }
    ).lean()

    if (!pendingRows.length) {
        return { checkedCount: 0, canceledCount: 0 }
    }

    const candidateOrderIds = pendingRows.map((row) => row._id)
    const paidCheckoutRows = await TouristMenuOrderCheckout.find(
        {
            customerOrderId: { $in: candidateOrderIds },
            status: 'PAID'
        },
        { customerOrderId: 1 }
    ).lean()

    const paidOrderIdSet = new Set(paidCheckoutRows.map((row) => String(row.customerOrderId || '')))
    const cancellableOrderIds = candidateOrderIds.filter((id) => !paidOrderIdSet.has(String(id)))

    if (!cancellableOrderIds.length) {
        return { checkedCount: candidateOrderIds.length, canceledCount: 0 }
    }

    const result = await CustomerOrder.updateMany(
        {
            _id: { $in: cancellableOrderIds },
            orderType: 'BOOKING_REQUEST',
            status: 'PROCESSING',
            updatedAt: { $lte: threshold }
        },
        {
            $set: {
                status: 'CANCELED',
                cancelReason: 'Booking auto-canceled due to unpaid payment link expiration (24 hours).'
            }
        }
    )

    return {
        checkedCount: candidateOrderIds.length,
        canceledCount: result?.modifiedCount || 0
    }
}
