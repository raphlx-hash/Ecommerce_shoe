import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  userName: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  size: { type: String },
  color: { type: String },
  quantity: { type: Number, default: 1, min: 1 },
}, { timestamps: true });

export default mongoose.model('CartItem', cartItemSchema);


