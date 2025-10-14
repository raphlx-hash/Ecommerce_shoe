import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import TotalCount from '../models/TotalCount.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [products, fallbackUsers, fallbackOrders, revenueAgg, tc] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totals.total' } } }]),
      TotalCount.findOne({}).sort({ updatedAt: -1 })
    ]);
    const revenue = tc?.totalRevenue ?? (revenueAgg[0]?.total || 0);
    const users = tc?.totalUsers ?? fallbackUsers;
    const orders = tc?.totalOrders ?? fallbackOrders;
    res.json({ products, users, orders, revenue });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// List orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(500);
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// List users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(500);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;


