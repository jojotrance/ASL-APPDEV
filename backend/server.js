import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import signRoutes from './routes/signs.js';
import translateRoutes from './routes/translate.js';
import userRoutes from './routes/users.js';

// ...existing code...
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signs', signRoutes);
app.use('/api/v1/translate', translateRoutes);
app.use('/api/v1/users', userRoutes);

// ...existing code...
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
