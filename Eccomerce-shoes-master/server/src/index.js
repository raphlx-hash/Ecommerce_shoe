import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import adminRoutes from './routes/admin.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import path from 'path';

dotenv.config();

const app = express();

app.use(helmet());
// CORS: allow any dev origin (including file:// served pages via Live Server)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: false
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlist', wishlistRoutes);

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Server running on :${port}`));
  })
  .catch(err => {
    console.error('Failed to connect DB', err);
    process.exit(1);
  });


