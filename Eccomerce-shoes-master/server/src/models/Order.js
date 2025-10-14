import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: String,
  price: Number,
  quantity: Number,
  size: String,
  color: String,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, trim: true },
  items: [orderItemSchema],
  totals: {
    subtotal: Number,
    shipping: Number,
    tax: Number,
    total: Number
  },
  shipping: {
    email: String,
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    phone: String
  },
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  orderNumber: { type: String, unique: true },
  expectedDeliveryText: { type: String }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);


