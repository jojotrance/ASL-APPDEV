import mongoose from 'mongoose';

const signSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  videoUrl: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Sign', signSchema);
