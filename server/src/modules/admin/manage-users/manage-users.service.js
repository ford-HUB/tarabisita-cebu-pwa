import mongoose from 'mongoose'
import CustomerOrder from '../../business/customer-orders/models/customer-order.model.js'
import RestaurantOrderReview from '../../tourist/restaurant-order-reviews/models/restaurant-order-review.model.js'

/** Counts menu orders and booking requests placed by the tourist (placedByUserId). */
export const getAdminUserActivityCountsByUserId = async (userId) => {
  const id = String(userId || '').trim()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { totalOrdersBookings: 0, reviewCount: 0 }
  }
  const oid = new mongoose.Types.ObjectId(id)
  const [totalOrdersBookings, reviewCount] = await Promise.all([
    CustomerOrder.countDocuments({ placedByUserId: oid }),
    RestaurantOrderReview.countDocuments({ userId: oid })
  ])
  return { totalOrdersBookings, reviewCount }
}
