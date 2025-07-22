import mongoose from 'mongoose';

const SignSchema = new mongoose.Schema({
  // Add the new fields to your existing schema
  word: {  // Changed from 'label' to 'word' to match existing index
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true  // Add unique constraint to match existing index
  },
  frames: [{
    timestamp: Number,
    landmarks: [[{
      x: Number,
      y: Number,
      z: Number
    }]],
    handedness: [String]
  }],
  frameCount: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  },
  // Keep any existing fields you have
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Sign', SignSchema);