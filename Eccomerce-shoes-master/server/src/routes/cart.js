import express from 'express';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';

const router = express.Router();

// List cart by userName
router.get('/', async (req, res) => {
  try {
    const { userName } = req.query;
    if (!userName) return res.status(400).json({ message: 'userName required' });
    const items = await CartItem.find({ userName }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Add item
router.post('/', async (req, res) => {
  try {
    const { userName, productId, size, color, quantity, name, price, image } = req.body || {};
    if (!userName || String(userName).trim() === '') {
      return res.status(400).json({ message: 'userName is required' });
    }
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }
    const p = await Product.findById(productId).catch(() => null);
    if (!p) return res.status(404).json({ message: 'Product not found' });

    const existing = await CartItem.findOne({ userName, productId, size, color });
    if (existing) {
      existing.quantity += Number(quantity || 1);
      await existing.save();
      return res.json(existing);
    }

    const item = await CartItem.create({
      userName,
      productId,
      name: name ?? p.name,
      price: price ?? p.price,
      image: image ?? p.image,
      size,
      color,
      quantity: Number(quantity || 1),
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to add to cart' });
  }
});

// Update quantity
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const updated = await CartItem.findByIdAndUpdate(req.params.id, { quantity: Number(quantity) }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Remove item
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await CartItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

export default router;


