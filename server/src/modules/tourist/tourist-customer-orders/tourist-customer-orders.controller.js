import { getMyTouristCustomerOrders } from './tourist-customer-orders.service.js'

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
