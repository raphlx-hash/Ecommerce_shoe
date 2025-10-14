import express from 'express';
import WishlistItem from '../models/WishlistItem.js';
import Product from '../models/Product.js';

const router = express.Router();

// Add to wishlist
router.post('/', async (req, res) => {
  try {
    const { username, productId, size, color, name, price, image } = req.body || {};
    if (!username || !productId) {
      return res.status(400).json({ message: 'username and productId are required' });
    }

    // Ensure product exists
    const product = await Product.findById(productId).catch(() => null);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await WishlistItem.findOne({ username, productId, size, color });
    if (existing) return res.json(existing);

    const created = await WishlistItem.create({
      username,
      productId,
      name: name || product.name,
      price: price != null ? price : product.price,
      image: image || product.image,
      size,
      color,
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
});

export default router;
// List wishlist by username
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);
    const items = await WishlistItem.find({ username }).sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
});


