import { createBusinessActivityLogByUserId } from '../../modules/payments/payments.service.js'

export const extractRequestMeta = (req) => {
    const forwardedFor = req.headers['x-forwarded-for']
    const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : String(forwardedFor || req.ip || '').split(',')[0].trim()
    const userAgent = String(req.headers['user-agent'] || '')
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'MOBILE' : 'WEB_DESKTOP'

    return { ipAddress, userAgent, device }
}

export const appendActivityLog = async (req, payload) => {
    try {
        await createBusinessActivityLogByUserId(req.user._id, {
            ...payload,
            ...extractRequestMeta(req)
        })
    } catch (error) {
        console.error('Activity log write failed:', error.message)
    }
}

export const sanitizeBusinessPayload = (business) => ({
    _id: business._id,
    name: business.name,
    description: business.description,
    address: business.address,
    contact_info: business.contact_info,
    website: business.website,
    logo: business.logo,
    coverImage: business.coverImage,
    banner: business.banner || business.coverImage,
    businessLocation: business.businessLocation,
    socialMedia: business.socialMedia,
    category: business.category,
    verificationStatus: business.verificationStatus,
    publicProfileViewCount: business.publicProfileViewCount ?? 0
})
