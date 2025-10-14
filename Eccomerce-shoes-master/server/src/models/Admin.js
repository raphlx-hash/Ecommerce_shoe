import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true, collection: 'admins' });

export default mongoose.model('Admin', adminSchema);



