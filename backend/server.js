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
import statsRoute from './routes/stats.js';
import predictRoutes from './routes/predict.js';
import quickTrainRoutes from './routes/quickTrain.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for sign data
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/videos/fingerspell', express.static('data/fingerspell'));
app.use('/videos/numbers', express.static('data/numbers'));
app.use('/videos/greetings', express.static('data/greetings'));
// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signs', signRoutes);
app.use('/api/v1/translate', translateRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/asl', wlaslRouter);
app.use('/api/v1/stats', statsRoute);
app.use('/api/v1/predict', predictRoutes);
app.use('/api', signRoutes); // Mount signs routes at /api for predict endpoint
app.use('/api/quickTrain', quickTrainRoutes); // Mount quickTrain routes

const PORT = process.env.PORT || 5000;

console.log('Attempting to connect to MongoDB...');
console.log('Using connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second socket timeout
  maxPoolSize: 10, // Maximum number of connections
  bufferCommands: false, // Disable mongoose buffering
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
