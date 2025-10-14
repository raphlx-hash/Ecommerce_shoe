import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ropy_ecommerce';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true
  });
  console.log('MongoDB connected');
}


