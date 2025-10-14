import express from 'express';
import Product from '../models/Product.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({ storage });

// GET /api/products?gender=women&brand=Nike&q=sply
router.get('/', async (req, res) => {
  try {
    const { gender, brand, category, q, sort } = req.query;
    const filter = {};
    const toArray = (v) => (Array.isArray(v) ? v : [v]);
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const iRegexList = (arr) => arr.map((v) => new RegExp(`^${esc(String(v))}$`, 'i'));

    if (gender) filter.gender = { $in: iRegexList(toArray(gender)) };
    if (brand) filter.brand = { $in: iRegexList(toArray(brand)) };
    if (category) {
      // Support comma-delimited query values, case-insensitive, and match tokens inside comma-joined elements
      const tokens = toArray(category)
        .flatMap(v => String(v).split(','))
        .map(s => s.trim())
        .filter(Boolean);
      if (tokens.length === 1) {
        const t = esc(tokens[0]);
        const pattern = new RegExp(`(?:^|,)\\s*${t}\\s*(?:,|$)`, 'i');
        filter.category = { $regex: pattern };
      } else if (tokens.length > 1) {
        filter.$and = tokens.map((tok) => {
          const t = esc(tok);
          const pattern = new RegExp(`(?:^|,)\\s*${t}\\s*(?:,|$)`, 'i');
          return { category: { $regex: pattern } };
        });
      }
    }
    if (q) filter.name = { $regex: q, $options: 'i' };

    let query = Product.find(filter);
    if (sort === 'price-low') query = query.sort({ price: 1 });
    if (sort === 'price-high') query = query.sort({ price: -1 });
    if (sort === 'newest') query = query.sort({ createdAt: -1 });
    if (sort === 'rating') query = query.sort({ rating: -1 });

    const products = await query.limit(200);
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create product (supports multipart with image upload)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      name: body.name,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      description: body.description,
      image: req.file ? `/uploads/${req.file.filename}` : body.image,
      sizes: body.sizes ? (Array.isArray(body.sizes) ? body.sizes : String(body.sizes).split(',').map(s => s.trim()).filter(Boolean)) : [],
      colors: body.colors ? (Array.isArray(body.colors) ? body.colors : String(body.colors).split(',').map(c => c.trim()).filter(Boolean)) : [],
      inStock: body.inStock === 'true' || body.inStock === true,
      rating: Number(body.rating) || 0,
      reviews: Number(body.reviews) || 0,
      gender: body.gender,
      brand: body.brand,
      category: body.category ? (Array.isArray(body.category) ? body.category : [body.category]) : [],
      quantity: body.quantity != null ? Number(body.quantity) : 0,
      features: body.features ? (Array.isArray(body.features) ? body.features : String(body.features).split(',').map(f => f.trim()).filter(Boolean)) : [],
    };
    const created = await Product.create(payload);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {
      name: body.name,
      price: body.price != null ? Number(body.price) : undefined,
      originalPrice: body.originalPrice != null ? Number(body.originalPrice) : undefined,
      description: body.description,
      sizes: body.sizes ? (Array.isArray(body.sizes) ? body.sizes : String(body.sizes).split(',').map(s => s.trim()).filter(Boolean)) : undefined,
      colors: body.colors ? (Array.isArray(body.colors) ? body.colors : String(body.colors).split(',').map(c => c.trim()).filter(Boolean)) : undefined,
      inStock: body.inStock != null ? (body.inStock === 'true' || body.inStock === true) : undefined,
      gender: body.gender,
      brand: body.brand,
      category: body.category ? (Array.isArray(body.category) ? body.category : [body.category]) : undefined,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      features: body.features ? (Array.isArray(body.features) ? body.features : String(body.features).split(',').map(f => f.trim()).filter(Boolean)) : undefined,
    };
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    } else if (body.image) {
      updates.image = body.image;
    }
    // Remove undefined keys
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;


