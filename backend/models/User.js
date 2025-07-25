import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sex: { 
    type: String, 
    enum: ['male', 'female', 'rather not to say'], 
    default: 'rather not to say' 
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'admin'],
    default: 'guest' // When user registers, they start as 'guest' and admin approves them
  },
  photo: {
    public_id: String,
    url: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);