import {
    advanceMyCustomerOrderStatusByUserId,
    cancelMyCustomerOrderByUserId,
    listMyCustomerOrdersByUserId
} from './customer-orders.service.js'

export const getMyCustomerOrders = async (req, res) => {
    try {
        const data = await listMyCustomerOrdersByUserId(req.user._id)
        return res.status(200).json({ data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ORDERS_NOT_AVAILABLE') {
            return res.status(403).json({
                message: 'Customer orders are only available for businesses with a supported menu catalog.'
            })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const advanceMyCustomerOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.validatedData.params
        const data = await advanceMyCustomerOrderStatusByUserId(req.user._id, orderId)
        return res.status(200).json({ message: 'Order status updated', data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ORDERS_NOT_AVAILABLE') {
            return res.status(403).json({
                message: 'Customer orders are only available for businesses with a supported menu catalog.'
            })
        }
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Order not found' })
        }
        if (error.message === 'INVALID_STATUS_TRANSITION') {
            return res.status(400).json({ message: 'This order cannot be advanced from its current status.' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const cancelMyCustomerOrder = async (req, res) => {
    try {
        const { orderId } = req.validatedData.params
        const { cancelReason } = req.validatedData.body
        const data = await cancelMyCustomerOrderByUserId(req.user._id, orderId, cancelReason)
        return res.status(200).json({ message: 'Order canceled', data })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ORDERS_NOT_AVAILABLE') {
            return res.status(403).json({
                message: 'Customer orders are only available for businesses with a supported menu catalog.'
            })
        }
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ message: 'Order not found' })
        }
        if (error.message === 'ORDER_NOT_CANCELLABLE') {
            return res.status(400).json({ message: 'This order cannot be canceled.' })
        }
        return res.status(500).json({ message: error.message })
    }
}
