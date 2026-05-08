import {
    createBookingPaymentCheckoutPublicByToken,
    createMyBookingPaymentCheckoutByToken,
    createMyBookingRequestPaymentCheckout,
    getMyTouristCustomerOrders,
    resolveBookingPaymentLinkPublic,
    resolveMyBookingPaymentLink
} from './tourist-customer-orders.service.js'

const noStoreJson = (res, payload) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache'
    })
    return res.status(200).json(payload)
}

export const getMyTouristCustomerOrdersHandler = async (req, res) => {
    try {
        const data = await getMyTouristCustomerOrders(req.user._id)
        return noStoreJson(res, { data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not load orders.' })
    }
}

export const postMyBookingRequestPaymentCheckoutHandler = async (req, res) => {
    try {
        const { orderId } = req.validatedData.params
        const { returnBaseUrl, paymentMethod } = req.validatedData.body
        const data = await createMyBookingRequestPaymentCheckout({
            userId: req.user._id,
            customerOrderId: orderId,
            returnBaseUrl,
            paymentMethod
        })
        return res.status(200).json({
            message: 'Checkout created. Complete payment to confirm your booking.',
            data
        })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Booking request not found.' })
        }
        if (msg === 'BOOKING_PAYMENT_NOT_ALLOWED') {
            return res.status(400).json({ message: 'This request is not eligible for payment.' })
        }
        if (msg === 'BOOKING_NOT_APPROVED') {
            return res.status(409).json({ message: 'Booking is still waiting for approval.' })
        }
        if (msg === 'BUSINESS_NOT_FOUND' || msg === 'MENU_CATALOG_NOT_SUPPORTED') {
            return res.status(404).json({ message: 'Business not found or not available for booking/orders.' })
        }
        if (msg === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (msg === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (msg === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (msg === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({ message: 'Invalid return base URL.' })
        }
        if (msg === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build return URLs.' })
        }
        if (msg === 'GCASH_DIRECT_CHECKOUT_UNAVAILABLE') {
            return res.status(409).json({
                message:
                    'Direct GCash checkout is not available right now. Please choose Maya, GrabPay, or Card for this test flow.'
            })
        }
        if (msg === 'PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS') {
            return res.status(409).json({
                message: 'This payment method is currently unavailable for this business. Please choose another option.'
            })
        }
        return res.status(500).json({ message: error.message || 'Could not start booking payment.' })
    }
}

export const postMyBookingPaymentLinkResolveHandler = async (req, res) => {
    try {
        const { paymentToken } = req.validatedData.body
        const data = await resolveMyBookingPaymentLink({
            userId: req.user._id,
            paymentToken
        })
        return res.status(200).json({ data })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'INVALID_BOOKING_PAYMENT_TOKEN') {
            return res.status(400).json({ message: 'Invalid payment link.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_EXPIRED') {
            return res.status(410).json({ message: 'This payment link has expired.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_MISMATCH') {
            return res.status(403).json({ message: 'This payment link does not match your account.' })
        }
        if (msg === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Booking request not found.' })
        }
        if (msg === 'BOOKING_PAYMENT_NOT_ALLOWED') {
            return res.status(400).json({ message: 'This link is not valid for booking payment.' })
        }
        if (msg === 'BOOKING_ALREADY_PAID') {
            return res.status(409).json({ message: 'This booking is already paid.' })
        }
        return res.status(500).json({ message: error.message || 'Could not verify payment link.' })
    }
}

export const postMyBookingPaymentLinkCheckoutHandler = async (req, res) => {
    try {
        const { paymentToken, returnBaseUrl, paymentMethod } = req.validatedData.body
        const data = await createMyBookingPaymentCheckoutByToken({
            userId: req.user._id,
            paymentToken,
            returnBaseUrl,
            paymentMethod
        })
        return res.status(200).json({
            message: 'Checkout created. Complete payment to confirm your booking.',
            data
        })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'INVALID_BOOKING_PAYMENT_TOKEN') {
            return res.status(400).json({ message: 'Invalid payment link.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_EXPIRED') {
            return res.status(410).json({ message: 'This payment link has expired.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_MISMATCH') {
            return res.status(403).json({ message: 'This payment link does not match your account.' })
        }
        if (msg === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Booking request not found.' })
        }
        if (msg === 'BOOKING_PAYMENT_NOT_ALLOWED') {
            return res.status(400).json({ message: 'This request is not eligible for payment.' })
        }
        if (msg === 'BOOKING_ALREADY_PAID') {
            return res.status(409).json({ message: 'This booking is already paid.' })
        }
        if (msg === 'BOOKING_NOT_APPROVED') {
            return res.status(409).json({ message: 'Booking is still waiting for approval.' })
        }
        if (msg === 'BUSINESS_NOT_FOUND' || msg === 'MENU_CATALOG_NOT_SUPPORTED') {
            return res.status(404).json({ message: 'Business not found or not available for booking/orders.' })
        }
        if (msg === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (msg === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (msg === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (msg === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({ message: 'Invalid return base URL.' })
        }
        if (msg === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build return URLs.' })
        }
        if (msg === 'PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS') {
            return res.status(409).json({
                message: 'This payment method is currently unavailable for this business. Please choose another option.'
            })
        }
        return res.status(500).json({ message: error.message || 'Could not start booking payment.' })
    }
}

export const postBookingPaymentLinkResolvePublicHandler = async (req, res) => {
    try {
        const { paymentToken } = req.validatedData.body
        const data = await resolveBookingPaymentLinkPublic({ paymentToken })
        return res.status(200).json({ data })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'INVALID_BOOKING_PAYMENT_TOKEN') {
            return res.status(400).json({ message: 'Invalid payment link.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_EXPIRED') {
            return res.status(410).json({ message: 'This payment link has expired.' })
        }
        if (msg === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Booking request not found.' })
        }
        if (msg === 'BOOKING_PAYMENT_NOT_ALLOWED') {
            return res.status(400).json({ message: 'This link is not valid for booking payment.' })
        }
        if (msg === 'BOOKING_ALREADY_PAID') {
            return res.status(409).json({ message: 'This booking is already paid.' })
        }
        return res.status(500).json({ message: error.message || 'Could not verify payment link.' })
    }
}

export const postBookingPaymentLinkCheckoutPublicHandler = async (req, res) => {
    try {
        const { paymentToken, returnBaseUrl, paymentMethod } = req.validatedData.body
        const data = await createBookingPaymentCheckoutPublicByToken({
            paymentToken,
            returnBaseUrl,
            paymentMethod
        })
        return res.status(200).json({
            message: 'Checkout created. Complete payment to confirm your booking.',
            data
        })
    } catch (error) {
        const msg = error?.message || ''
        if (msg === 'INVALID_BOOKING_PAYMENT_TOKEN') {
            return res.status(400).json({ message: 'Invalid payment link.' })
        }
        if (msg === 'BOOKING_PAYMENT_TOKEN_EXPIRED') {
            return res.status(410).json({ message: 'This payment link has expired.' })
        }
        if (msg === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Booking request not found.' })
        }
        if (msg === 'BOOKING_PAYMENT_NOT_ALLOWED') {
            return res.status(400).json({ message: 'This request is not eligible for payment.' })
        }
        if (msg === 'BOOKING_ALREADY_PAID') {
            return res.status(409).json({ message: 'This booking is already paid.' })
        }
        if (msg === 'BOOKING_NOT_APPROVED') {
            return res.status(409).json({ message: 'Booking is still waiting for approval.' })
        }
        if (msg === 'BUSINESS_NOT_FOUND' || msg === 'MENU_CATALOG_NOT_SUPPORTED') {
            return res.status(404).json({ message: 'Business not found or not available for booking/orders.' })
        }
        if (msg === 'XENDIT_SECRET_KEY_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit secret key is not configured' })
        }
        if (msg === 'XENDIT_SECRET_KEY_INVALID') {
            return res.status(500).json({ message: 'Xendit secret key must start with xnd_' })
        }
        if (msg === 'XENDIT_INVOICE_URL_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'Xendit invoice URL is not configured' })
        }
        if (msg === 'CHECKOUT_RETURN_BASE_URL_INVALID') {
            return res.status(400).json({ message: 'Invalid return base URL.' })
        }
        if (msg === 'CHECKOUT_RETURN_URLS_INVALID') {
            return res.status(400).json({ message: 'Could not build return URLs.' })
        }
        if (msg === 'PAYMENT_METHOD_NOT_AVAILABLE_FOR_BUSINESS') {
            return res.status(409).json({
                message: 'This payment method is currently unavailable for this business. Please choose another option.'
            })
        }
        return res.status(500).json({ message: error.message || 'Could not start booking payment.' })
    }
}
