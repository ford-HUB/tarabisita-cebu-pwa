import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

const getKey = () => {
    const raw = process.env.BOOKING_PAYMENT_TOKEN_SECRET || process.env.JWT_SECRET || 'tarabisita-booking-pay'
    return crypto.createHash('sha256').update(String(raw), 'utf8').digest()
}

export const sealBookingPaymentPayload = (payload) => {
    const iv = crypto.randomBytes(IV_LEN)
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
    const json = Buffer.from(JSON.stringify(payload), 'utf8')
    const enc = Buffer.concat([cipher.update(json), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, enc]).toString('base64url')
}

export const openBookingPaymentPayload = (token) => {
    if (!token || typeof token !== 'string') {
        throw new Error('INVALID_BOOKING_PAYMENT_TOKEN')
    }
    const buf = Buffer.from(token, 'base64url')
    if (buf.length < IV_LEN + TAG_LEN + 1) {
        throw new Error('INVALID_BOOKING_PAYMENT_TOKEN')
    }
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const enc = buf.subarray(IV_LEN + TAG_LEN)
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv)
    decipher.setAuthTag(tag)
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    return JSON.parse(plain)
}
