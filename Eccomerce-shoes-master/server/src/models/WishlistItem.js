import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number },
  image: { type: String },
  size: { type: String },
  color: { type: String },
}, { timestamps: true, collection: 'wishlist' });

export default mongoose.model('WishlistItem', wishlistItemSchema);



