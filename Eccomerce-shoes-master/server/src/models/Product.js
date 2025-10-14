import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String },
  description: { type: String },
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 0, min: 0 },
  features: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  brand: { type: String, trim: true },
  category: [{ type: String, trim: true }]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);


