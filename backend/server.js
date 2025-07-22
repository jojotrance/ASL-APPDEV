import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cloudinary from 'cloudinary';

dotenv.config();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import authRoutes from './routes/auth.js';
import signRoutes from './routes/signs.js';
import translateRoutes from './routes/translate.js';
import userRoutes from './routes/users.js';
import wlaslRouter from './routes/video.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for sign data
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signs', signRoutes);
app.use('/api/v1/translate', translateRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/asl', wlaslRouter);

const PORT = process.env.PORT || 5000;

console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Full error:', err);
});
