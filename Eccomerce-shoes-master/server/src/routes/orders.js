import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// Create order
router.post('/', async (req, res) => {
  try {
    const { username, items, subtotal, shipping } = req.body || {};
    if (!username || !Array.isArray(items) || items.length === 0 || typeof subtotal !== 'number') {
      return res.status(400).json({ message: 'username, items[], and subtotal are required' });
    }

    const shippingCost = 9.99;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + shippingCost + tax).toFixed(2));
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const expectedDeliveryText = 'within 7 days from order';

    const normalizedItems = items.map((it) => ({
      product: it.productId || it.product || undefined,
      name: it.name,
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      size: it.size,
      color: it.color,
      image: it.image,
    }));

    const created = await Order.create({
      username,
      items: normalizedItems,
      totals: { subtotal, shipping: shippingCost, tax, total },
      shipping: shipping || {},
      status: 'processing',
      orderNumber,
      expectedDeliveryText,
    });

    res.status(201).json({ id: created._id, orderNumber: created.orderNumber, expectedDeliveryText });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get orders by username
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    const filter = username ? { username } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

export default router;


