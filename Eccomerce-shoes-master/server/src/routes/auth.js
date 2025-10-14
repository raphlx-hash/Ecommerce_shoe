import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, firstName, lastName });

    res.status(201).json({ id: user._id, email: user.email, firstName, lastName, role: user.role });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Debug log
    
    // Check both User and Admin collections
    let user = await User.findOne({ email });
    let userRole = 'customer'; // Default role for users
    
    if (user) {
      userRole = user.role || 'customer';
    } else {
      // If not found in User collection, check Admin collection
      user = await Admin.findOne({ email });
      if (user) {
        userRole = user.role || 'admin';
      }
    }
    
    if (!user) {
      console.log('User not found in any collection');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user._id, role: userRole }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: userRole } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Check if a user email exists (for checkout validation)
router.get('/exists', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ exists: false, message: 'email is required' });
    
    // Check both User and Admin collections
    const user = await User.findOne({ email });
    const admin = await Admin.findOne({ email });
    const exists = !!(user || admin);
    
    res.json({ exists });
  } catch (e) {
    res.status(500).json({ exists: false, message: 'Failed to check email' });
  }
});

// Create test admin endpoint (for development)
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, passwordHash, firstName, lastName, role: 'admin' });

    res.status(201).json({ id: admin._id, email: admin.email, firstName, lastName, role: admin.role });
  } catch (e) {
    res.status(500).json({ message: 'Admin creation failed' });
  }
});

export default router;


