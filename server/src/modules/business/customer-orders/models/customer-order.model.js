import mongoose from 'mongoose'

const customerOrderLineItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      default: '',
      trim: true
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
      max: 99
    },
    unit: {
      type: Number,
      default: 0,
      min: 0
    },
    lineNotes: {
      type: String,
      default: '',
      maxlength: 500,
      trim: true
    },
    image: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
)

const customerOrderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true
    },
    /** Logged-in tourist who placed the order (menu checkout / pay-at-pickup). Optional for legacy rows. */
    placedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    orderCode: {
      type: String,
      required: true,
      trim: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true
    },
    billingType: {
      type: String,
      enum: [
        'PAY_AT_PICKUP',
        'PREPAID_ONLINE',
        'GCASH',
        'MAYA',
        'GRAB_PAY',
        'BANK_TRANSFER',
        'CARD'
      ],
      default: 'PAY_AT_PICKUP',
      trim: true
    },
    orderType: {
      type: String,
      enum: ['MENU_ORDER', 'BOOKING_REQUEST'],
      default: 'MENU_ORDER',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      maxlength: 2000
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    productImage: {
      type: String,
      default: ''
    },
    productDetails: {
      type: String,
      default: ''
    },
    /** Snapshot lines for tourist re-order / history (optional on legacy rows). */
    lineItems: {
      type: [customerOrderLineItemSchema],
      default: undefined
    },
    itemsCount: {
      type: Number,
      required: true,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'PHP',
      trim: true
    },
    status: {
      type: String,
      enum: ['PLACED', 'PROCESSING', 'FINISHED', 'CANCELED'],
      default: 'PLACED'
    },
    cancelReason: {
      type: String,
      default: ''
    },
    /** Set when the consolidated "your order is ready" email has been sent for this order's checkout group. */
    completionEmailSentAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true, collection: 'customerorders' }
)

customerOrderSchema.index({ businessId: 1, createdAt: -1 })
customerOrderSchema.index({ businessId: 1, orderCode: 1 }, { unique: true })
customerOrderSchema.index({ placedByUserId: 1, createdAt: -1 })
customerOrderSchema.index({ placedByUserId: 1, businessId: 1, status: 1, completionEmailSentAt: 1 })

const CustomerOrder = mongoose.model('CustomerOrder', customerOrderSchema)

export default CustomerOrder
