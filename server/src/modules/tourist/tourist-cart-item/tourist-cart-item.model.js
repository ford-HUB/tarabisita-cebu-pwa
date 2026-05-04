import mongoose from 'mongoose'

/** One row in the tourist cart (restaurant dish, beach package, etc.). */
const touristCartItemSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    catalogItemId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true },
    image: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1, max: 99 },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    flavor: { type: String, default: '' },
    preparationTime: { type: String, default: '' },
    servingSize: { type: String, default: '' },
    spiceLevel: { type: String, default: '' },
    allergens: { type: String, default: '' },
    /** Special instructions for this line (e.g. spice, allergies) — shown to the business on the order. */
    itemNotes: { type: String, default: '', maxlength: 500 }
  },
  { _id: false }
)

/** One saved cart per tourist user (`touristcarts` collection). */
const touristUserCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: { type: [touristCartItemSchema], default: [] },
    deselectedItemKeys: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'touristcarts' }
)

const TouristUserCart =
  mongoose.models.TouristUserCart || mongoose.model('TouristUserCart', touristUserCartSchema)

export default TouristUserCart
