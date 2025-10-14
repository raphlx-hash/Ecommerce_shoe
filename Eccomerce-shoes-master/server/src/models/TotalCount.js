import mongoose from 'mongoose';

// Stores admin-level total counts snapshot
// Collection name explicitly set to 'TotalCount'
const totalCountSchema = new mongoose.Schema({
  totalOrders: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}, { timestamps: true, collection: 'TotalCount' });

export default mongoose.model('TotalCount', totalCountSchema);



